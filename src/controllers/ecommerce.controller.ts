import {
  Count,
  CountSchema,
  FilterExcludingWhere,
  repository,
  Where
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  HttpErrors,
  param,
  patch,
  post,
  put,
  requestBody,
  response,
} from '@loopback/rest';
import {Item, Orders, Users} from '../models';
import {
  ItemRepository,
  OrdersRepository,
  UsersRepository,
} from '../repositories';


// eski hali
/* interface OrderRequest {
  user_id: number;
  item_id: number;
  count: number;
} */

//multiple order'a izin veren hali
interface BulkOrderRequest {
  user_id: number;
  items: Array<{
    item_id: number;
    count: number;
  }>;
}



export class EcommerceController {
  constructor(
    @repository(ItemRepository)
    public itemRepository: ItemRepository,
    @repository(OrdersRepository)
    public ordersRepository: OrdersRepository,
    @repository(UsersRepository)
    public usersRepository: UsersRepository,
  ) { }

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
    description: 'Multiple sipariş',
    content: {'application/json': {schema: getModelSchemaRef(Orders)}},
  })
  async createOrder(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(BulkOrderRequest, {
            title: 'BulkOrderRequest',
            exclude: [],
          }),
        },
      },
    })
    orderReq: BulkOrderRequest,
  ): Promise<{
    user: {id: number; username: string};
    orders: Array<{
      id: number;
      item_id: number;
      stock_number: number;
      item_name: string;
    }>;
  }> {

    // odev
    // item var mı yok mu kontrol ediyoruz
    // user var mı yok mu onu da kontrol edelim


    // 1) Kullanıcı kontrolü
    let userInstance: Users;
    try {
      userInstance = await this.usersRepository.findById(orderReq.user_id);
    } catch {
      throw new HttpErrors.NotFound(
        `User with id=${orderReq.user_id} not found`,
      );
    }

    const createdOrders: Array<{
      id: number;
      item_id: number;
      stock_number: number;
      item_name: string;
    }> = [];

    // 2) Her ürün için stok kontrolü ve sipariş işlemi
    for (const {item_id, count} of orderReq.items) {
      // Ürün var mı?
      let itemInstance: Item;
      try {
        itemInstance = await this.itemRepository.findById(item_id);
      } catch {
        throw new HttpErrors.NotFound(`Item with id=${item_id} not found`);
      }

      // Yeterli stok mu?
      if (itemInstance.stock < count) {
        throw new HttpErrors.BadRequest(
          `Insufficient stock for item id=${item_id}: requested ${count}, available ${itemInstance.stock}`,
        );
      }

      // Stok güncelle
      await this.itemRepository.updateById(itemInstance.id, {
        stock: itemInstance.stock - count,
      });

      // Sipariş kaydet
      const newOrder = await this.ordersRepository.create({
        user_id: userInstance.id,
        item_id: itemInstance.id,
        stock_number: count,
      });

      createdOrders.push({
        id: newOrder.id!,
        item_id: itemInstance.id,
        stock_number: count,
        item_name: itemInstance.item_name,
      });
    }

    // 3) Sonucu dön
    return {
      user: {id: userInstance.id!, username: userInstance.username},
      orders: createdOrders,
    };
  }
}
