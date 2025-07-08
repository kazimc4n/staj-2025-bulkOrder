import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';

const config = {
  name: 'atezstaj',
  connector: 'postgresql',
  host: 'localhost',
  port: 5432,
  user: 'atezstaj',
  password: '1234',
  database: 'postgres',
};

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class AtezDataSource
  extends juggler.DataSource
  implements LifeCycleObserver
{
  static dataSourceName = 'atezstaj';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.atezstaj', {optional: true})
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}
