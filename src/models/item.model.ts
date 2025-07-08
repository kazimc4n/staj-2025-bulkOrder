import {Model, model, Entity, property} from '@loopback/repository';

@model({
  name: 'item',
})
export class Item extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
    required: true,
  })
  item_name: string;

  @property({
    type: 'number',
    required: true,
    // jsonSchema: {
    //   precision: 10,
    //   scale: 2,
    // },
  })
  price: number;

  @property({
    type: 'number',
    required: true,
  })
  stock: number;

  @property({
    type: 'date',
    default: () => new Date(),
  })
  created_at?: string;

  constructor(data?: Partial<Item>) {
    super(data);
  }
}
