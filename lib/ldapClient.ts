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
   * Retorna la información del usuario si la autenticación es exitosa
   */
  async authenticate(username: string, password: string): Promise<{ authenticated: boolean; user?: any }> {
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
          resolve({ authenticated: false });
          return;
        }

        console.log(`Usuario ${username} autenticado exitosamente`);

        // Obtener información del usuario
        this.getUserInfo(client, username)
          .then((userInfo) => {
            client.unbind();
            if (!userInfo) {
              console.log(`Usuario ${username} está deshabilitado o no encontrado`);
              resolve({ authenticated: false });
            } else {
              resolve({ authenticated: true, user: userInfo });
            }
          })
          .catch((err) => {
            console.error('Error obteniendo información del usuario:', err);
            client.unbind();
            resolve({ authenticated: false });
          });
      });

      // Manejar errores de conexión
      client.on('error', (err) => {
        console.error('Error de conexión LDAP:', err.message);
        resolve({ authenticated: false });
      });
    });
  }

  /**
   * Obtiene información del usuario si está activo (no deshabilitado) en AD
   */
  private async getUserInfo(client: any, username: string): Promise<any> {
    return new Promise((resolve) => {
      // Reemplazar {username} en el filtro
      const filter = this.userSearchFilter.replace('{username}', username);

      const searchOptions = {
        filter: filter,
        scope: 'sub' as const,
        attributes: ['sAMAccountName', 'userAccountControl', 'cn', 'mail', 'displayName', 'memberOf'],
      };

      console.log(`Buscando usuario en: ${this.userSearchBase} con filtro: ${filter}`);

      client.search(this.userSearchBase, searchOptions, (err: any, res: any) => {
        if (err) {
          console.error('Error en búsqueda LDAP:', err);
          resolve(null);
          return;
        }

        let found = false;
        res.on('searchEntry', (entry: any) => {
          found = true;

          // Obtener atributos de forma segura
          const attributes: any = {};
          const memberOfValues: string[] = [];

          if (entry.attributes) {
            entry.attributes.forEach((attr: any) => {
              if (attr.type === 'memberOf') {
                // memberOf puede tener múltiples valores
                const values = attr.vals || attr.values || attr._vals || [];
                values.forEach((val: any) => {
                  memberOfValues.push(val.toString());
                });
              } else {
                const value = attr.vals?.[0] || attr.values?.[0] || attr._vals?.[0];
                if (value) {
                  attributes[attr.type] = value.toString();
                }
              }
            });
          } else if (entry.object) {
            // Fallback si entry.object existe
            Object.assign(attributes, entry.object);
            if (attributes.memberOf) {
              if (Array.isArray(attributes.memberOf)) {
                memberOfValues.push(...attributes.memberOf);
              } else {
                memberOfValues.push(attributes.memberOf);
              }
            }
          }

          // Extraer nombres de grupos del DN (CN=nombregrupo,OU=...)
          const groups = memberOfValues.map((dn: string) => {
            const match = dn.match(/^CN=([^,]+)/i);
            return match ? match[1].toLowerCase() : '';
          }).filter((group: string) => group !== '');

          const userInfo = {
            username: attributes.sAMAccountName || username,
            displayName: attributes.displayName || attributes.cn || username,
            email: attributes.mail || `${username}@coopacaustro.fin.ec`,
            cn: attributes.cn,
            groups: groups,
          };
          console.log(`Usuario encontrado:`, userInfo);
          console.log(`Grupos del usuario:`, groups);
          resolve(userInfo);
        });

        res.on('error', (err: any) => {
          console.error('Error en búsqueda LDAP:', err);
          resolve(null);
        });

        res.on('end', () => {
          if (!found) {
            console.log(`Usuario ${username} no encontrado o está deshabilitado`);
            resolve(null);
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

          // Obtener atributos de forma segura
          const attributes: any = {};
          if (entry.attributes) {
            entry.attributes.forEach((attr: any) => {
              const value = attr.vals?.[0] || attr.values?.[0] || attr._vals?.[0];
              if (value) {
                attributes[attr.type] = value.toString();
              }
            });
          } else if (entry.object) {
            Object.assign(attributes, entry.object);
          }

          const user = {
            dn: entry.objectName,
            sAMAccountName: attributes.sAMAccountName,
            cn: attributes.cn,
            mail: attributes.mail,
            displayName: attributes.displayName,
            userPrincipalName: attributes.userPrincipalName,
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
