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
    description: 'Orders model instance',
    content: {'application/json': {schema: getModelSchemaRef(Orders)}},
  })
  async createOrder(
    @requestBody()
    order: OrderRequest,
  ): Promise<Orders> {
    // odev
    // item var mı yok mu kontrol ediyoruz
    // user var mı yok mu onu da kontrol edelim
    const item = await this.itemRepository.findById(order.item_id);
    if (!item || item.stock < order.count)
      throw new Error('Item not available or insufficient stock');

    // Update item stock
    item.stock -= order.count;
    await this.itemRepository.updateById(item.id, item);

    const newOrder = {
      user_id: order.user_id,
      item_id: order.item_id,
      stock_number: order.count,
    };

    return this.ordersRepository.create(newOrder);

    // odev
    // return ederken bana kullanıcı bilgilerini de döndür
    // item bilgilerini de döndür
  }

  // odev
  // sepete birden fazla ürün eklenebilir

  // odev
  // ürünleri isim, fiyat aralığı veya stok durumuna göre filtreleyip listeleyen endpoint
}
