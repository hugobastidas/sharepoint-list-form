import ldap from 'ldapjs';

/**
 * Cliente LDAP para autenticación con Active Directory
 */
export class LdapClient {
  private server: string;
  private port: number;
  private domain: string;
  private useSsl: boolean;
  private baseDN: string;
  private userSearchBase: string;
  private userSearchFilter: string;

  constructor() {
    this.server = process.env.LDAP_SERVER || 'localhost';
    this.port = parseInt(process.env.LDAP_PORT || '389');
    this.domain = process.env.LDAP_DOMAIN || 'empresa.local';
    this.useSsl = process.env.LDAP_USE_SSL === 'True' || process.env.LDAP_USE_SSL === 'true';
    this.baseDN = process.env.LDAP_BASE_DN || 'DC=empresa,DC=local';
    this.userSearchBase = process.env.LDAP_USER_SEARCH_BASE || this.baseDN;
    this.userSearchFilter = process.env.LDAP_USER_SEARCH_FILTER ||
      '(&(&(objectClass=user)(objectCategory=person))(!(userAccountControl:1.2.840.113556.1.4.803:=2))(sAMAccountName={username}))';
  }

  /**
   * Construye la URL del servidor LDAP
   */
  private getUrl(): string {
    const protocol = this.useSsl ? 'ldaps' : 'ldap';
    return `${protocol}://${this.server}:${this.port}`;
  }

  /**
   * Autentica un usuario contra el servidor LDAP usando autenticación directa (username@domain)
   */
  async authenticate(username: string, password: string): Promise<boolean> {
    return new Promise((resolve) => {
      const url = this.getUrl();
      const client = ldap.createClient({
        url: url,
        timeout: 5000,
        connectTimeout: 10000,
        tlsOptions: {
          rejectUnauthorized: false, // Para desarrollo, en producción configurar certificados
        },
      });

      // Autenticación directa usando username@domain
      const userPrincipalName = `${username}@${this.domain}`;

      console.log(`Intentando autenticar: ${userPrincipalName} en ${url}`);

      // Intentar bind con las credenciales
      client.bind(userPrincipalName, password, (err) => {
        if (err) {
          console.error('Error de autenticación LDAP:', err.message);
          client.unbind();
          resolve(false);
          return;
        }

        console.log(`Usuario ${username} autenticado exitosamente`);

        // Verificar que el usuario esté activo (no deshabilitado)
        this.verifyUserActive(client, username)
          .then((isActive) => {
            client.unbind();
            if (!isActive) {
              console.log(`Usuario ${username} está deshabilitado`);
              resolve(false);
            } else {
              resolve(true);
            }
          })
          .catch((err) => {
            console.error('Error verificando estado del usuario:', err);
            client.unbind();
            resolve(false);
          });
      });

      // Manejar errores de conexión
      client.on('error', (err) => {
        console.error('Error de conexión LDAP:', err.message);
        resolve(false);
      });
    });
  }

  /**
   * Verifica si el usuario está activo (no deshabilitado) en AD
   */
  private async verifyUserActive(client: any, username: string): Promise<boolean> {
    return new Promise((resolve) => {
      // Reemplazar {username} en el filtro
      const filter = this.userSearchFilter.replace('{username}', username);

      const searchOptions = {
        filter: filter,
        scope: 'sub' as const,
        attributes: ['sAMAccountName', 'userAccountControl', 'cn', 'mail', 'displayName'],
      };

      console.log(`Buscando usuario en: ${this.userSearchBase} con filtro: ${filter}`);

      client.search(this.userSearchBase, searchOptions, (err: any, res: any) => {
        if (err) {
          console.error('Error en búsqueda LDAP:', err);
          resolve(false);
          return;
        }

        let found = false;
        res.on('searchEntry', (entry: any) => {
          found = true;
          console.log(`Usuario ${username} encontrado y activo`);
          resolve(true);
        });

        res.on('error', (err: any) => {
          console.error('Error en búsqueda LDAP:', err);
          resolve(false);
        });

        res.on('end', () => {
          if (!found) {
            console.log(`Usuario ${username} no encontrado o está deshabilitado`);
            resolve(false);
          }
        });
      });
    });
  }

  /**
   * Busca información de un usuario en LDAP
   */
  async searchUser(username: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const url = this.getUrl();
      const client = ldap.createClient({
        url: url,
        timeout: 5000,
        connectTimeout: 10000,
        tlsOptions: {
          rejectUnauthorized: false,
        },
      });

      // Reemplazar {username} en el filtro
      const filter = this.userSearchFilter.replace('{username}', username);

      const searchOptions = {
        filter: filter,
        scope: 'sub' as const,
        attributes: ['sAMAccountName', 'cn', 'mail', 'displayName', 'dn', 'userPrincipalName'],
      };

      // Realizar búsqueda anónima o con usuario de servicio
      client.search(this.userSearchBase, searchOptions, (err, res) => {
        if (err) {
          console.error('Error en búsqueda LDAP:', err);
          client.unbind();
          reject(err);
          return;
        }

        let found = false;
        res.on('searchEntry', (entry) => {
          found = true;
          const user = {
            dn: entry.objectName,
            sAMAccountName: entry.object.sAMAccountName,
            cn: entry.object.cn,
            mail: entry.object.mail,
            displayName: entry.object.displayName,
            userPrincipalName: entry.object.userPrincipalName,
          };
          client.unbind();
          resolve(user);
        });

        res.on('error', (err) => {
          console.error('Error en búsqueda LDAP:', err);
          client.unbind();
          reject(err);
        });

        res.on('end', () => {
          if (!found) {
            client.unbind();
            resolve(null);
          }
        });
      });

      client.on('error', (err) => {
        console.error('Error de conexión LDAP:', err);
        reject(err);
      });
    });
  }
}

// Exportar una instancia singleton
export const ldapClient = new LdapClient();
