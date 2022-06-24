/* eslint-disable object-shorthand */
import {AfterViewInit, Component, ElementRef, OnInit, ViewChild, NgZone} from '@angular/core';
import {EventsService} from './services/events.service';
import {SerialLinkService} from './services/serial-link.service';
import {UdpService} from './services/udp.service';
import {HttpService} from './services/http.service';
import {StorageService} from './services/storage.service';
import {UtilsService} from './services/utils.service';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
//import {sprintf} from 'sprintf-js';
import {File} from '@ionic-native/file/ngx';
import {MatTooltip} from '@angular/material/tooltip';
import {NgScrollbar} from 'ngx-scrollbar';
import {Platform} from '@ionic/angular';

import {Filesystem, Directory, Encoding} from '@capacitor/filesystem';
//import { Capacitor } from "@capacitor/core";

import {SetStyles} from './set-styles/set-styles.page';
import {EditScrolls} from './edit-scrolls/edit-scrolls';
import {EditFreeDNS} from './edit-freeDNS/edit-freeDNS';
import {EditBinds} from './binds/binds.page';

import * as gConst from './gConst';
import * as gIF from './gIF';

import {LoadingController} from '@ionic/angular';

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit, AfterViewInit {
    @ViewChild('containerRef') containerRef: ElementRef;
    @ViewChild(NgScrollbar) scrollbarRef: NgScrollbar;

    bkgImgWidth: number;
    bkgImgHeight: number;

    imgDim = {} as gIF.imgDim_t;

    scrolls: gIF.scroll_t[] = [
        {
            name: 'floor-1',
            yPos: 10,
            duration: 200,
        },
        {
            name: 'floor-2',
            yPos: 40,
            duration: 800,
        },
    ];

    partDesc: gIF.partDesc_t[] = [];
    partMap = new Map();

    //dragIdx: number = -1;
    //attrIdx: number = -1;
    //selAttr = {} as gIF.hostedAttr_t;
    loading: any;

    constructor(
        private events: EventsService,
        private serialLink: SerialLinkService,
        private udp: UdpService,
        private http: HttpService,
        public storage: StorageService,
        private loadingController: LoadingController,
        //private nativeStorage: NativeStorage,
        private matDialog: MatDialog,
        private file: File,
        //private el: ElementRef,
        private ngZone: NgZone,
        private platform: Platform,
        private utils: UtilsService
    ) {
        this.platform.ready().then(() => {
            //console.log('screen width: ' + platform.width());
            //console.log('screen height: ' + platform.height());
            setTimeout(() => {
                this.init();
            }, 100);
        });
    }

    /***********************************************************************************************
     * fn          ngAfterViewInit
     *
     * brief
     *
     */
    ngAfterViewInit() {
        // ---
    }

    /***********************************************************************************************
     * fn          ngOnInit
     *
     * brief
     *
     */
    async ngOnInit() {
        window.onbeforeunload = () => {
            this.udp.closeSocket();
        };
        // ---
    }

    /***********************************************************************************************
     * fn          init
     *
     * brief
     *
     */
    async init() {
        try {
            const base64 = await Filesystem.readFile({
                directory: Directory.ExternalStorage,
                path: 'Download/floor_plan.jpg',
            });
            const imgUrl = `data:image/jpeg;base64,${base64.data}`;
            this.setBkgImg(imgUrl);
        } catch (err) {
            console.log('read img err: ' + err.code);
            this.setBkgImg(gConst.DFLT_BKG_IMG);
        }

        try {
            const parts = await Filesystem.readFile({
                directory: Directory.ExternalStorage,
                path: 'Download/parts.json',
                encoding: Encoding.UTF8,
            });
            this.partDesc = JSON.parse(parts.data);
            for (const desc of this.partDesc) {
                const part = {} as gIF.part_t;
                part.devName = desc.devName;
                part.part = desc.part;
                part.url = desc.url;
                this.partMap.set(desc.partNum, part);
            }
            console.log(JSON.stringify(this.partDesc));
        } catch (err) {
            console.log('loadParts: read parts err: ' + err.code);
        }

        //this.scrolls = [];
        //const scrolls = await this.ns.getScrolls();
        this.storage.getScrolls().then(
            (scrolls) => {
                this.scrolls = JSON.parse(scrolls);
            },
            (err) => {
                console.log('get scrolss err: ' + err.code);
            }
        );

        this.loading = await this.loadingController.create({
            message: '... wait',
            duration: 10000,
            mode: 'md',
        });
    }

    /***********************************************************************************************
     * fn          onScroll
     *
     * brief
     *
     */
    onScroll(idx: number) {
        const pos = {
            top: (this.scrolls[idx].yPos * this.imgDim.height) / 100,
            duration: this.scrolls[idx].duration,
        };
        this.scrollbarRef.scrollTo(pos).then(() => {
            // ---
        });
    }

    /***********************************************************************************************
     * fn          getAttrStyle
     *
     * brief
     *
     */
    getAttrStyle(attr: any) {
        const attrStyle = attr.value.style;
        const retStyle = {
            color: attrStyle.color,
            'background-color': attrStyle.bgColor,
            'font-size.px': attrStyle.fontSize,
            'border-color': attrStyle.borderColor,
            'border-width.px': attrStyle.borderWidth,
            'border-style': attrStyle.borderStyle,
            'border-radius.px': attrStyle.borderRadius,
            'padding-top.px': attrStyle.paddingTop,
            'padding-right.px': attrStyle.paddingRight,
            'padding-bottom.px': attrStyle.paddingBottom,
            'padding-left.px': attrStyle.paddingLeft,
        };
        if (attr.value.isValid === false) {
            retStyle.color = 'gray';
            retStyle['background-color'] = 'transparent';
            retStyle['border-color'] = 'gray';
            retStyle['border-width.px'] = 2;
            retStyle['border-style'] = 'dotted';
        }
        return retStyle;
    }

    /***********************************************************************************************
     * fn          setBkgImg
     *
     * brief
     *
     */
    setBkgImg(imgSrc: string) {
        const bkgImg = new Image();
        bkgImg.src = imgSrc;
        bkgImg.onload = () => {
            //let el = document.getElementById('containerID');
            this.bkgImgWidth = bkgImg.width;
            this.bkgImgHeight = bkgImg.height;
            const el = this.containerRef.nativeElement;
            const divDim = el.getBoundingClientRect();
            this.imgDim.width = divDim.width;
            this.imgDim.height = Math.round((divDim.width / bkgImg.width) * bkgImg.height);
            el.style.height = this.imgDim.height + 'px';
            el.style.backgroundImage = 'url(' + imgSrc + ')';
            el.style.backgroundAttachment = 'scroll';
            el.style.backgroundRepeat = 'no-repeat';
            el.style.backgroundSize = 'contain';
        };
    }

    /***********************************************************************************************
     * fn          getAttrPosition
     *
     * brief
     *
     */
    getAttrPosition(attr: any) {
        const attrPos = attr.value.pos;

        return {
            x: attrPos.x * this.imgDim.width,
            y: attrPos.y * this.imgDim.height,
        };
    }

    /***********************************************************************************************
     * fn          onDragEnded
     *
     * brief
     *
     */
    async onDragEnded(event: any, keyVal: any) {
        const pos: gIF.nsPos_t = {
            x: event.x / this.imgDim.width,
            y: event.y / this.imgDim.height,
        };
        keyVal.value.pos = pos;

        await this.storage.setAttrPos(pos, keyVal);
    }

    /***********************************************************************************************
     * fn          setStyles
     *
     * brief
     *
     */
    async setStyles(keyVal: any) {
        setTimeout(() => {
            const dialogConfig = new MatDialogConfig();
            dialogConfig.data = keyVal;
            dialogConfig.width = '350px';
            dialogConfig.autoFocus = false;
            dialogConfig.disableClose = true;
            dialogConfig.panelClass = 'set-styles-container';

            const dlgRef = this.matDialog.open(SetStyles, dialogConfig);
            dlgRef.afterOpened().subscribe(() => {
                this.dismissLoading();
            });
        }, 10);

        await this.loading.present();
    }

    /***********************************************************************************************
     * fn          onEditScrollsClick
     *
     * brief
     *
     */
    async onEditScrollsClick(scrollRef) {
        setTimeout(() => {
            const dlgData = {
                scrolls: JSON.parse(JSON.stringify(this.scrolls)),
                scrollRef: scrollRef,
                imgDim: this.imgDim,
            };
            const dialogConfig = new MatDialogConfig();
            dialogConfig.data = dlgData;
            dialogConfig.width = '250px';
            dialogConfig.autoFocus = false;
            dialogConfig.disableClose = true;
            dialogConfig.panelClass = 'edit-scrolls-container';

            const dlgRef = this.matDialog.open(EditScrolls, dialogConfig);

            dlgRef.afterOpened().subscribe(() => {
                this.dismissLoading();
            });
            dlgRef.afterClosed().subscribe((data) => {
                if (data) {
                    this.scrolls = data;
                    this.storage.setScrolls(this.scrolls);
                }
            });
        }, 10);

        await this.loading.present();
    }

    /***********************************************************************************************
     * fn          setDNS
     *
     * brief
     *
     */
    async setDNS() {
        setTimeout(() => {
            const dialogConfig = new MatDialogConfig();
            dialogConfig.data = '';
            dialogConfig.width = '350px';
            dialogConfig.autoFocus = false;
            dialogConfig.disableClose = true;
            dialogConfig.panelClass = 'set-dns-container';

            const dlgRef = this.matDialog.open(EditFreeDNS, dialogConfig);
            dlgRef.afterOpened().subscribe(() => {
                this.dismissLoading();
            });
        }, 10);

        await this.loading.present();
    }

    /***********************************************************************************************
     * fn          editBinds
     *
     * brief
     *
     */
    async editBinds() {
        setTimeout(() => {
            const dlgData = {
                partMap: this.partMap,
            };
            const dialogConfig = new MatDialogConfig();
            dialogConfig.data = dlgData;
            dialogConfig.width = '700px';
            dialogConfig.autoFocus = false;
            dialogConfig.disableClose = true;
            dialogConfig.panelClass = 'edit-binds-container';

            const dlgRef = this.matDialog.open(EditBinds, dialogConfig);

            dlgRef.afterOpened().subscribe(() => {
                this.dismissLoading();
            });
        }, 10);

        await this.loading.present();
    }

    /***********************************************************************************************
     * fn          showTooltip
     *
     * brief
     *
     */
    showTooltip(tt: MatTooltip, attr: gIF.hostedAttr_t) {
        let ttMsg = '';
        ttMsg += `attr-name: ${attr.name} \n`;
        //ttMsg += sprintf('attr-name: %s \n', attr.name);
        ttMsg += `S/N: ${this.utils.extToHex(attr.extAddr)} \n`;
        //ttMsg += sprintf('S/N: %s \n', this.utils.extToHex(attr.extAddr));
        const partDesc: gIF.part_t = this.partMap.get(attr.partNum);
        if (partDesc) {
            ttMsg += `node-name: ${partDesc.devName} \n`;
            //ttMsg += sprintf('node-name: %s \n', partDesc.devName);
            ttMsg += `part: ${partDesc.part} \n`;
            //ttMsg += sprintf('part: %s \n', partDesc.part);
            ttMsg += `url: ${partDesc.url} \n`;
            //ttMsg += sprintf('url: %s \n', partDesc.url);
        }
        tt.message = ttMsg;
        tt.showDelay = 500;
        tt.tooltipClass = 'attr-tooltip';
        tt.show();
    }
    /***********************************************************************************************
     * fn          hideTooltip
     *
     * brief
     *
     *
    hideTooltip(tt: MatTooltip){
        tt.hide();
    }
    */

    /***********************************************************************************************
     * fn          dismissLoading
     *
     * brief
     *
     */
    dismissLoading() {
        this.loading.dismiss().then(
            () => {
                this.loadingController
                    .create({
                        message: '... wait',
                        duration: 10000,
                        mode: 'md',
                    })
                    .then(
                        (loading) => {
                            this.loading = loading;
                        },
                        (err) => {
                            console.log(err);
                        }
                    );
            },
            (err) => {
                console.error(err);
            }
        );
    }
}