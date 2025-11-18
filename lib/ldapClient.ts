import ldap from 'ldapjs';

/**
 * Cliente LDAP para autenticación
 */
export class LdapClient {
  private url: string;
  private baseDN: string;

  constructor() {
    this.url = process.env.LDAP_URL || 'ldap://localhost:389';
    this.baseDN = process.env.LDAP_BASE_DN || 'DC=empresa,DC=local';
  }

  /**
   * Autentica un usuario contra el servidor LDAP
   */
  async authenticate(username: string, password: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const client = ldap.createClient({
        url: this.url,
        timeout: 5000,
        connectTimeout: 10000,
      });

      // Construir el DN del usuario
      const userDN = `CN=${username},${this.baseDN}`;

      // Intentar bind con las credenciales
      client.bind(userDN, password, (err) => {
        if (err) {
          console.error('Error de autenticación LDAP:', err.message);
          client.unbind();
          resolve(false);
          return;
        }

        console.log(`Usuario ${username} autenticado exitosamente`);
        client.unbind();
        resolve(true);
      });

      // Manejar errores de conexión
      client.on('error', (err) => {
        console.error('Error de conexión LDAP:', err);
        resolve(false);
      });
    });
  }

  /**
   * Busca información de un usuario en LDAP
   */
  async searchUser(username: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const client = ldap.createClient({
        url: this.url,
        timeout: 5000,
        connectTimeout: 10000,
      });

      const searchOptions = {
        filter: `(cn=${username})`,
        scope: 'sub' as const,
        attributes: ['cn', 'mail', 'displayName', 'dn'],
      };

      // Realizar búsqueda anónima o con usuario de servicio
      client.search(this.baseDN, searchOptions, (err, res) => {
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
            cn: entry.object.cn,
            mail: entry.object.mail,
            displayName: entry.object.displayName,
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
