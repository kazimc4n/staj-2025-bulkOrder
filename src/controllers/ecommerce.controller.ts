import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  patch,
  put,
  del,
  requestBody,
  response,
} from '@loopback/rest';
import {Item, Orders, Users} from '../models';
import {
  ItemRepository,
  OrdersRepository,
  UsersRepository,
} from '../repositories';

interface OrderRequest {
  user_id: number;
  item_id: number;
  count: number;
}

export class EcommerceController {
  constructor(
    @repository(ItemRepository)
    public itemRepository: ItemRepository,
    @repository(OrdersRepository)
    public ordersRepository: OrdersRepository,
    @repository(UsersRepository)
    public usersRepository: UsersRepository,
  ) {}

  @post('/items')
  @response(200, {
    description: 'Item model instance',
    content: {'application/json': {schema: getModelSchemaRef(Item)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Item, {
            title: 'NewItem',
            exclude: ['id'],
          }),
        },
      },
    })
    item: Omit<Item, 'id'>,
  ): Promise<Item> {
    return this.itemRepository.create(item);
  }

  @post('/users')
  @response(200, {
    description: 'User model instance',
    content: {'application/json': {schema: getModelSchemaRef(Users)}},
  })
  async createUser(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Users, {
            title: 'newUser',
            exclude: ['id'],
          }),
        },
      },
    })
    user: Omit<Users, 'id'>,
  ): Promise<Users> {
    return this.usersRepository.create(user);
  }

  @get('/items/count')
  @response(200, {
    description: 'Item model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(@param.where(Item) where?: Where<Item>): Promise<Count> {
    return this.itemRepository.count(where);
  }

  @get('/items')
  @response(200)
  async findItems(): Promise<Item[]> {
    return this.itemRepository.find();
  }

  @get('/orders')
  @response(200)
  async findOrders(): Promise<Orders[]> {
    return this.ordersRepository.find();
  }

  @get('/users')
  @response(200)
  async findUsers(): Promise<Users[]> {
    return this.usersRepository.find();
  }

  @patch('/items')
  @response(200, {
    description: 'Item PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Item, {partial: true}),
        },
      },
    })
    item: Item,
    @param.where(Item) where?: Where<Item>,
  ): Promise<Count> {
    return this.itemRepository.updateAll(item, where);
  }

  @get('/items/{id}')
  @response(200, {
    description: 'Item model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Item, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Item, {exclude: 'where'}) filter?: FilterExcludingWhere<Item>,
  ): Promise<Item> {
    return this.itemRepository.findById(id, filter);
  }

  @patch('/items/{id}')
  @response(204, {
    description: 'Item PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Item, {partial: true}),
        },
      },
    })
    item: Item,
  ): Promise<void> {
    await this.itemRepository.updateById(id, item);
  }

  @put('/items/{id}')
  @response(204, {
    description: 'Item PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() item: Item,
  ): Promise<void> {
    await this.itemRepository.replaceById(id, item);
  }

  @del('/items/{id}')
  @response(204, {
    description: 'Item DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.itemRepository.deleteById(id);
  }

  @post('/orders')
  @response(200, {
    description: 'Order created with user and item info',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            order: getModelSchemaRef(Orders),
            user: getModelSchemaRef(Users),
            item: getModelSchemaRef(Item),
          },
        },
      },
    },
  })
  async createOrder(
    @requestBody()
    order: OrderRequest,
  ): Promise<{order: Orders; user: Users; item: Item}> {
    // odev
    // item var mı yok mu kontrol ediyoruz
    // user var mı yok mu onu da kontrol edelim
    const user = await this.usersRepository.findOne({
      where: {id: order.user_id},
    });
    if (!user) {
      throw new Error('User not found');
    }

    const item = await this.itemRepository.findOne({
      where: {id: order.item_id},
    });
    if (!item || item.stock < order.count) {
      throw new Error('Item not available or insufficient stock');
    }

    item.stock -= order.count;
    await this.itemRepository.updateById(item.id, item);

    const newOrder = {
      user_id: order.user_id,
      item_id: order.item_id,
      stock_number: order.count,
    };

    const createdOrder = await this.ordersRepository.create(newOrder);

    // odev
    // return ederken bana kullanıcı bilgilerini de döndür
    // item bilgilerini de döndür
    return {
      order: createdOrder,
      user: user,
      item: item,
    };
  }

  // odev
  // sepete birden fazla ürün eklenebilir
  @post('/orders/multiple')
  @response(200, {
    description: 'Multiple orders created',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            orders: {type: 'array', items: getModelSchemaRef(Orders)},
            user: getModelSchemaRef(Users),
            items: {type: 'array', items: getModelSchemaRef(Item)},
          },
        },
      },
    },
  })
  async createMultipleOrders(
    @requestBody()
    request: {
      user_id: number;
      items: {item_id: number; count: number}[];
    },
  ): Promise<{orders: Orders[]; user: Users; items: Item[]}> {
    try {
      let user = await this.usersRepository.findOne({
        where: {id: request.user_id},
      });
      if (!user) throw new Error('User not found');

      const orders: Orders[] = [];
      const items: Item[] = [];

      for (const orderItem of request.items) {
        const item = await this.itemRepository.findOne({
          where: {id: orderItem.item_id},
        });

        if (!item || item.stock < orderItem.count) {
          throw new Error(
            `Item ${orderItem.item_id} not available or insufficient stock`,
          );
        }

        item.stock -= orderItem.count;
        await this.itemRepository.updateById(item.id, item);

        const newOrder = await this.ordersRepository.create({
          user_id: request.user_id,
          item_id: orderItem.item_id,
          stock_number: orderItem.count,
        });

        orders.push(newOrder);
        items.push(item);
      }

      return {
        orders,
        user,
        items,
      };
    } catch (error) {
      throw new Error(
        'Sepete urun ekleme islemi basarisiz oldu. ' + error.message,
      );
    }
  }

  // odev
  // ürünleri isim, fiyat aralığı veya stok durumuna göre filtreleyip listeleyen endpoint
  @get('/items/filter')
  @response(200, {
    description: 'Filtered items',
    content: {
      'application/json': {
        schema: {type: 'array', items: getModelSchemaRef(Item)},
      },
    },
  })
  async filterItems(
    @param.query.string('name') name?: string,
    @param.query.number('minPrice') minPrice?: number,
    @param.query.number('maxPrice') maxPrice?: number,
    @param.query.number('minStock') minStock?: number,
    @param.query.number('maxStock') maxStock?: number,
  ): Promise<Item[]> {
    const where: any = {};

    if (name) {
      where.item_name = {like: `%${name}%`};
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }
    if (minStock !== undefined || maxStock !== undefined) {
      where.stock = {};
      if (minStock !== undefined) where.stock.gte = minStock;
      if (maxStock !== undefined) where.stock.lte = maxStock;
    }

    return this.itemRepository.find({where});
  }
}
