import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DataSource } from 'typeorm';

import { UserService } from './services';
import { Services } from './services';
import { UserController } from './controllers';

import  { Entities } from '@persistence/entities'
import { AuthService } from '@auth/services';
import { PersistenceModule } from '@persistence/persistence.module';

@Module({
    imports: [
      PersistenceModule,
      AccountModule,],
    providers: [UserService],
    controllers: [
      UserController
    ],
    exports: [UserService],
})
export class AccountModule{
  constructor(private datasource: DataSource) { }
}