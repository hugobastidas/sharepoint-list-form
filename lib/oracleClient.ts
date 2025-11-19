import oracledb from 'oracledb';

/**
 * Interfaz para el resultado de la consulta de crédito
 */
export interface CreditoInfo {
  ccuenta: string;
  sucursal: string;
  diasmora: number;
}

/**
 * Cliente para Oracle Database 19c
 * Maneja la conexión y consultas a la base de datos Oracle
 */
class OracleClient {
  private pool: oracledb.Pool | null = null;

  /**
   * Inicializa el pool de conexiones a Oracle
   */
  async initialize(): Promise<void> {
    if (this.pool) {
      return; // Ya inicializado
    }

    try {
      const user = process.env.ORACLE_USER;
      const password = process.env.ORACLE_PASSWORD;
      const connectionString = process.env.ORACLE_CONNECTION_STRING;

      if (!user || !password || !connectionString) {
        throw new Error(
          'Faltan variables de entorno: ORACLE_USER, ORACLE_PASSWORD, ORACLE_CONNECTION_STRING'
        );
      }

      this.pool = await oracledb.createPool({
        user,
        password,
        connectString: connectionString,
        poolMin: 1,
        poolMax: 10,
        poolIncrement: 1,
      });

      console.log('✓ Oracle Client inicializado');
      console.log('  - Connection:', connectionString);
    } catch (error: any) {
      console.error('Error inicializando Oracle Client:', error);
      throw new Error(`Error inicializando Oracle Client: ${error.message}`);
    }
  }

  /**
   * Busca información de un crédito específico
   */
  async buscarCredito(numeroCredito: string): Promise<CreditoInfo | null> {
    if (!this.pool) {
      await this.initialize();
    }

    let connection: oracledb.Connection | undefined;

    try {
      connection = await this.pool!.getConnection();

      const query = `
        SELECT
          a.ccuenta,
          b.nombre AS sucursal,
          GREATEST(TRUNC(SYSDATE) - MIN(a.fvencimiento), 0) AS diasmora
        FROM tsaldos a
        JOIN tsucursales b
          ON a.csucursal = b.csucursal
          AND b.fhasta = fncfhasta
        WHERE a.csubsistema = '06'
          AND a.fhasta = fncfhasta
          AND a.categoria IN ('CAPPRO','CAPORD')
          AND a.principal = 1
          AND a.saldomonedacuenta > 0
          AND a.ccuenta = :numeroCredito
        GROUP BY
          a.ccuenta,
          b.nombre
      `;

      const result = await connection.execute<any>(
        query,
        { numeroCredito },
        {
          outFormat: oracledb.OUT_FORMAT_OBJECT,
        }
      );

      if (!result.rows || result.rows.length === 0) {
        return null; // Crédito no encontrado
      }

      const row = result.rows[0];

      return {
        ccuenta: row.CCUENTA,
        sucursal: row.SUCURSAL,
        diasmora: row.DIASMORA,
      };
    } catch (error: any) {
      console.error('Error buscando crédito en Oracle:', error);
      throw new Error(`Error buscando crédito: ${error.message}`);
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (error) {
          console.error('Error cerrando conexión:', error);
        }
      }
    }
  }

  /**
   * Cierra el pool de conexiones
   */
  async close(): Promise<void> {
    if (this.pool) {
      try {
        await this.pool.close(10);
        this.pool = null;
        console.log('✓ Oracle pool cerrado');
      } catch (error: any) {
        console.error('Error cerrando pool:', error);
      }
    }
  }
}

// Instancia singleton
let oracleClient: OracleClient | null = null;

/**
 * Factory function para obtener la instancia del cliente Oracle
 */
export function getOracleClient(): OracleClient {
  if (!oracleClient) {
    oracleClient = new OracleClient();
  }
  return oracleClient;
}

/**
 * Función auxiliar para buscar un crédito
 */
export async function buscarCredito(numeroCredito: string): Promise<CreditoInfo | null> {
  const client = getOracleClient();
  return await client.buscarCredito(numeroCredito);
}
