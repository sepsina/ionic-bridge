/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @angular-eslint/component-class-suffix */
import { Component, Inject, OnInit, ElementRef, NgZone, ViewChild } from '@angular/core';
import { SerialLinkService } from '../services/serial-link.service';
import { StorageService } from '../services/storage.service';
import { UtilsService } from '../services/utils.service';
import { Validators, FormControl } from '@angular/forms';
import { MatSelectionListChange} from '@angular/material/list';
import { MatSelectChange } from '@angular/material/select';
import { MatTooltip } from '@angular/material/tooltip';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import * as gConst from '../gConst';
import * as gIF from '../gIF';

@Component({
    selector: 'app-binds',
    templateUrl: './binds.page.html',
    styleUrls: ['./binds.page.scss'],
})
export class EditBinds implements OnInit {

    @ViewChild('free_binds') free_binds: ElementRef;

    allBindSrc: gIF.hostedBinds_t[] = [];
    bindSrc: gIF.hostedBinds_t;
    usedBindDst: gIF.bind_t[] = [];
    freeBindDst: gIF.bind_t[] = [];
    allBindDst: gIF.bind_t[] = [];

    selUsedBindDst: gIF.bind_t = null;
    selFreeBindDst: gIF.bind_t = null;

    usedBindDstListSelected: gIF.bind_t[] = [];
    freeBindDstListSelected: gIF.bind_t[] = [];

    bindSourceDesc: gIF.descVal_t[] = [];
    usedBindDstDesc: gIF.descVal_t[] = [];
    freeBindDstDesc: gIF.descVal_t[] = [];

    emptyFlag = true;
    noSrcBinds = true;

    nameFormCtrl = new FormControl('', [Validators.required]);

    constructor(private dialogRef: MatDialogRef<EditBinds>,
                @Inject(MAT_DIALOG_DATA) public dlgData: any,
                private serial: SerialLinkService,
                private storage: StorageService,
                private utils: UtilsService,
                private ngZone: NgZone) {
        // ---
    }

    /***********************************************************************************************
     * fn          ngOnInit
     *
     * brief
     *
     */
    ngOnInit() {
        this.refresh();
    }

    /***********************************************************************************************
     * fn          refresh
     *
     * brief
     *
     */
    refresh() {

        this.allBindSrc = JSON.parse(JSON.stringify(Array.from(this.storage.bindsMap.values())));
        const attribs: gIF.hostedAttr_t[] = JSON.parse(JSON.stringify(Array.from(this.storage.attrMap.values())));

        this.allBindDst = [];
        for(const attr of attribs) {
            if(attr.clusterServer) {
                const bind = {} as gIF.bind_t;
                bind.valid = true;
                bind.extAddr = attr.extAddr;
                bind.name = attr.name;
                bind.partNum = attr.partNum;
                bind.clusterID = attr.clusterID;
                bind.shortAddr = attr.shortAddr;
                bind.endPoint = attr.endPoint;
                this.allBindDst.push(bind);
            }
        }
        if(this.allBindSrc.length) {
            this.bindSrc = this.allBindSrc[0];
            this.nameFormCtrl.setValue(this.bindSrc.name);
            this.ngZone.run(() => {
                this.setBinds(this.bindSrc);
            });
            this.setBindSourceDesc(this.bindSrc);
            this.noSrcBinds = false;
        }
        else {
            this.noSrcBinds = true;
            this.emptyFlag = true;
        }
        this.deSelAll();
    }

    /***********************************************************************************************
     * fn          setBinds
     *
     * brief
     *
     */
    public setBinds(bindSrc: gIF.hostedBinds_t) {

        this.usedBindDst = [];
        this.freeBindDst = [];
        for(const bindDst of this.allBindDst) {
            if(bindDst.clusterID === bindSrc.clusterID) {
                this.freeBindDst.push(bindDst);
            }
        }
        for(const bindDst of bindSrc.bindsDst) {
            const idx = this.freeBindDst.findIndex((bind)=>{
                if(bind.extAddr === bindDst.dstExtAddr) {
                    if(bind.endPoint === bindDst.dstEP) {
                        if(bind.clusterID === bindSrc.clusterID) {
                            return true;
                        }
                    }
                }
                return false;
            });
            if(idx > -1) {
                this.usedBindDst.push(this.freeBindDst[idx]);
                this.freeBindDst.splice(idx, 1);
            }
            else {
                const bind = {} as gIF.bind_t;
                bind.valid = false;
                bind.name = 'unknown';
                this.usedBindDst.push(bind);
            }
        }
        let numBindSrc = 0;
        for(const bind of this.allBindSrc) {
            if(bind.extAddr === bindSrc.extAddr) {
                numBindSrc += bind.bindsDst.length;
            }
        }
        this.emptyFlag = true;
        let numEmpty = 0;
        if(numBindSrc < bindSrc.maxBinds) {
            numEmpty = bindSrc.maxBinds - numBindSrc;
            this.emptyFlag = false;
        }
        let numUsed = 0;
        if(this.usedBindDst.length < numBindSrc) {
            numUsed = numBindSrc - this.usedBindDst.length;
        }
        for(let i = 0; i < numEmpty; i++) {
            const bind = {} as gIF.bind_t;
            bind.valid = false;
            bind.name = '--- empty ---';
            this.usedBindDst.push(bind);
        }
        for(let i = 0; i < numUsed; i++) {
            const bind = {} as gIF.bind_t;
            bind.valid = false;
            bind.name = '--- used ---';
            this.usedBindDst.push(bind);
        }
        for(let i = this.freeBindDst.length; i < gConst.MAX_SRC_BINDS; i++) {
            const bind = {} as gIF.bind_t;
            bind.valid = false;
            bind.name = '--- empty ---';
            this.freeBindDst.push(bind);
        }
    }

    /***********************************************************************************************
     * fn          bindSrcSelected
     *
     * brief
     *
     */
    public bindSrcSelected(event: MatSelectChange) {

        this.nameFormCtrl.setValue(this.bindSrc.name);
        this.setBindSourceDesc(this.bindSrc);

        this.deSelAll();
        this.ngZone.run(()=>{
            this.setBinds(this.bindSrc);
        });
    }

    /***********************************************************************************************
     * fn          setBindSourceDesc
     *
     * brief
     *
     */
    public setBindSourceDesc(srcBind: gIF.hostedBinds_t) {

        this.bindSourceDesc = [];
        const partDesc: gIF.part_t = this.dlgData.partMap.get(srcBind.partNum);
        if(partDesc) {
            let descVal = {} as gIF.descVal_t;
            descVal.key = 'S/N:';
            descVal.value = this.utils.extToHex(srcBind.extAddr);
            this.bindSourceDesc.push(descVal);
            descVal = {} as gIF.descVal_t;
            descVal.key = 'node-name:';
            descVal.value = partDesc.devName;
            this.bindSourceDesc.push(descVal);
            descVal = {} as gIF.descVal_t;
            descVal.key = 'label:';
            descVal.value = partDesc.part;
            this.bindSourceDesc.push(descVal);
        }
    }

    /***********************************************************************************************
     * fn          usedBindDstChanged
     *
     * brief
     *
     */
    public usedBindDstChanged(event: MatSelectionListChange) {

        this.selUsedBindDst = event.option.value;
        this.setUsedBindDstDesc(this.selUsedBindDst);
    }

    /***********************************************************************************************
     * fn          setUsedBindDstDesc
     *
     * brief
     *
     */
    public setUsedBindDstDesc(dst: gIF.bind_t) {

        this.usedBindDstDesc = [];
        const partDesc: gIF.part_t = this.dlgData.partMap.get(dst.partNum);
        if(partDesc) {
            let descVal = {} as gIF.descVal_t;
            descVal.key = 'S/N:';
            descVal.value = this.utils.extToHex(dst.extAddr);
            this.usedBindDstDesc.push(descVal);
            descVal = {} as gIF.descVal_t;
            descVal.key = 'node-name:';
            descVal.value = partDesc.devName;
            this.usedBindDstDesc.push(descVal);
            descVal = {} as gIF.descVal_t;
            descVal.key = 'label:';
            descVal.value = partDesc.part;
            this.usedBindDstDesc.push(descVal);
        }
    }

    /***********************************************************************************************
     * fn          freeBindDstChanged
     *
     * brief
     *
     */
    public freeBindDstChanged(event: MatSelectionListChange) {

        this.selFreeBindDst = event.option.value;
        this.setFreeBindDstDesc(this.selFreeBindDst);
    }

    /***********************************************************************************************
     * fn          setFreeBindDstDesc
     *
     * brief
     *
     */
    public setFreeBindDstDesc(target: gIF.bind_t) {

        this.freeBindDstDesc = [];
        const partDesc: gIF.part_t = this.dlgData.partMap.get(target.partNum);
        if(partDesc) {
            let descVal = {} as gIF.descVal_t;
            descVal.key = 'S/N:';
            descVal.value = this.utils.extToHex(target.extAddr);
            this.freeBindDstDesc.push(descVal);
            descVal = {} as gIF.descVal_t;
            descVal.key = 'node-name:';
            descVal.value = partDesc.devName;
            this.freeBindDstDesc.push(descVal);
            descVal = {} as gIF.descVal_t;
            descVal.key = 'label:';
            descVal.value = partDesc.part;
            this.freeBindDstDesc.push(descVal);
        }
    }

    /***********************************************************************************************
     * fn          addBindDst
     *
     * brief
     *
     */
    public addBindDst() {

        let numValid = 0;
        for(const bindDst of this.usedBindDst) {
            if(bindDst.valid) {
                numValid++;
            }
        }
        if(numValid < gConst.MAX_DST_BINDS) {
            if(this.selFreeBindDst) {
                const bindDst = {} as gIF.bindDst_t;
                bindDst.dstExtAddr = this.selFreeBindDst.extAddr;
                bindDst.dstEP = this.selFreeBindDst.endPoint;
                this.bindSrc.bindsDst.push(bindDst);
                this.ngZone.run(()=>{
                    this.setBinds(this.bindSrc);
                });

                this.deSelAll();
            }
        }
    }

    /***********************************************************************************************
     * fn          removeBindDst
     *
     * brief
     *
     */
    public removeBindDst() {

        if(this.selUsedBindDst) {
            const idx = this.bindSrc.bindsDst.findIndex((bindDst)=>{
                if(this.selUsedBindDst.extAddr === bindDst.dstExtAddr) {
                    if(this.selUsedBindDst.endPoint === bindDst.dstEP) {
                        return true;
                    }
                }
                return false;
            });
            if (idx > -1) {
                this.bindSrc.bindsDst.splice(idx, 1);
            }

            this.ngZone.run(()=>{
                this.setBinds(this.bindSrc);
            });

            this.deSelAll();
        }
    }

    /***********************************************************************************************
     * fn          showTooltip
     *
     * brief
     *
     */
    showTooltip(tt: MatTooltip, bind: gIF.bind_t) {

        let ttMsg = '';
        ttMsg += `S/N: ${this.utils.extToHex(bind.extAddr)} \n`;
        const partDesc: gIF.part_t = this.dlgData.partMap.get(bind.partNum);
        if(partDesc) {
            ttMsg += `node-name: ${partDesc.devName} \n`;
            ttMsg += `part: ${partDesc.part} \n`;
            ttMsg += `url: ${partDesc.url} \n`;
        }
        tt.message = ttMsg;
        tt.showDelay = 500;
        tt.tooltipClass = 'bind-tooltip';
        tt.show();
    }

    /***********************************************************************************************
     * fn          wrSrcBinds
     *
     * brief
     *
     */
    public wrSrcBinds() {
        this.serial.wrBinds(JSON.stringify(this.bindSrc));
    }

    /***********************************************************************************************
     * fn          wrBindLoc
     *
     * brief
     *
     */
    async wrBindName() {
        this.bindSrc.name = this.nameFormCtrl.value;
        await this.storage.setBindsName(this.nameFormCtrl.value, this.bindSrc);
    }

    /***********************************************************************************************
     * fn          deSelAll
     *
     * brief
     *
     */
    private deSelAll() {

        this.selUsedBindDst = null;
        this.usedBindDstListSelected = [];
        this.usedBindDstDesc = [];

        this.selFreeBindDst = null;
        this.freeBindDstListSelected = [];
        this.freeBindDstDesc = [];
    }

    /***********************************************************************************************
     * fn          close
     *
     * brief
     *
     */
    close() {
        this.dialogRef.close();
    }

    /***********************************************************************************************
     * fn          save
     *
     * brief
     *
     *
    save() {
        this.dialogRef.close();
    }
    */
}
