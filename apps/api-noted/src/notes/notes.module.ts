import { Module } from '@nestjs/common';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { FlexibleFormsController, PublicFormsController, FormsCatalogController } from './flexible-forms.controller';
import { FlexibleFormsService } from './flexible-forms.service';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';
import { SharingController } from './sharing.controller';
import { SharingService } from './sharing.service';
import { CakeShareController } from './cake-share.controller';

@Module({
  controllers: [
    FormsCatalogController,
    NotesController,
    FlexibleFormsController,
    PublicFormsController,
    FriendsController,
    SharingController,
    CakeShareController,
  ],
  providers: [
    NotesService,
    FlexibleFormsService,
    FriendsService,
    SharingService,
  ],
  exports: [
    NotesService,
    FlexibleFormsService,
    FriendsService,
    SharingService,
  ],
})
export class NotesModule {}
