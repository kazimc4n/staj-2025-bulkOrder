import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {AtezDataSource} from '../datasources';
import {Item} from '../models';

export class ItemRepository extends DefaultCrudRepository<
  Item,
  typeof Item.prototype.id
> {
  constructor(@inject('datasources.atezstaj') dataSource: AtezDataSource) {
    super(Item, dataSource);
  }
}
