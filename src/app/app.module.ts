import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

import { IonicModule } from '@ionic/angular';

import { AppComponent } from './app.component';
import { SetStyles } from './set-styles/set-styles.page';
import { EditScrolls } from './edit-scrolls/edit-scrolls';
import { EditFreeDNS } from './edit-freeDNS/edit-freeDNS';
import { EditBinds } from './binds/binds.page';
import { HighlightSel } from './directives/highlight-sel.directive';

import { AppRoutingModule } from './app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AngularMaterialModule } from './angular-material/angular-material.module';
import { AngularDraggableModule } from 'angular2-draggable';
import { NgScrollbarModule } from 'ngx-scrollbar';

import { Serial } from '@ionic-native/serial/ngx';
import { File } from '@ionic-native/file/ngx';
import { HTTP } from '@ionic-native/http/ngx';

//import { Drivers } from '@ionic/storage'
//import { IonicStorageModule } from '@ionic/storage-angular';
//import * as CordovaSQLiteDriver from 'localforage-cordovasqlitedriver'

import { NativeStorage } from '@ionic-native/native-storage/ngx';

@NgModule({
    declarations: [AppComponent, SetStyles, EditScrolls, EditFreeDNS, EditBinds, HighlightSel],
    entryComponents: [],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        BrowserModule,
        IonicModule.forRoot(),
        AppRoutingModule,
        BrowserAnimationsModule,
        AngularMaterialModule,
        AngularDraggableModule,
        NgScrollbarModule,
        //IonicStorageModule.forRoot({
        //    driverOrder: [CordovaSQLiteDriver._driver, Drivers.IndexedDB, Drivers.LocalStorage]
        //})
    ],
    providers: [Serial, File, HTTP, NativeStorage],
    bootstrap: [AppComponent],
})
export class AppModule {}