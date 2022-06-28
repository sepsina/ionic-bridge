/* eslint-disable @angular-eslint/component-class-suffix */
import { Component, Inject, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { SerialLinkService } from '../services/serial-link.service';
//import { nsService } from '../ns.service';
import { EventsService } from '../services/events.service';
import { Validators, FormControl } from '@angular/forms';
//import {sprintf} from 'sprintf-js';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import * as gIF from '../gIF';

@Component({
    selector: 'app-edit-scrolls',
    templateUrl: './edit-scrolls.html',
    styleUrls: ['./edit-scrolls.css'],
})
export class EditScrolls implements OnInit, AfterViewInit {

    @ViewChild('selList') selList;

    maxPos = 100;
    maxDuration = 2000;

    scrollCtrl = new FormControl('', Validators.required);

    scrolls: gIF.scroll_t[] = [];
    newIdx = 0;

    nameCtrl = new FormControl('', Validators.required);
    yPosCtrl = new FormControl(0, [Validators.required, Validators.max(this.maxPos)]);
    durationCtrl = new FormControl(0, [Validators.required, Validators.max(this.maxDuration)]);

    constructor(public dialogRef: MatDialogRef<EditScrolls>,
                @Inject(MAT_DIALOG_DATA) public dlgData: any,
                public serialLink: SerialLinkService,
                public events: EventsService) {
        // ---
    }

    /***********************************************************************************************
     * fn          ngOnInit
     *
     * brief
     *
     */
    ngOnInit(): void {
        //this.scrolls = JSON.parse(JSON.stringify(this.dlgData.scrolls));
        for(const scroll of this.dlgData.scrolls) {
            const newScroll = {} as gIF.scroll_t;
            newScroll.name = scroll.name;
            newScroll.yPos = scroll.yPos;
            newScroll.duration = scroll.duration;
            this.scrolls.push(newScroll);
        }
    }
    /***********************************************************************************************
     * fn          ngAfterViewInit
     *
     * brief
     *
     */
    ngAfterViewInit(): void {
        setTimeout(()=>{
            const scroll = this.scrolls[0];
            if(scroll) {
                this.scrollCtrl.setValue(scroll);
            }
        }, 0);
    }
    /***********************************************************************************************
     * fn          save
     *
     * brief
     *
     */
    save() {
        this.dialogRef.close(this.scrolls);
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
     * fn          nameErr
     *
     * brief
     *
     */
    nameErr() {
        if(this.nameCtrl.hasError('required')) {
            return 'You must enter a value';
        }
    }
    /***********************************************************************************************
     * fn          posErr
     *
     * brief
     *
     */
    posErr() {
        if(this.yPosCtrl.hasError('required')) {
            return 'You must enter a value';
        }
        if(this.yPosCtrl.hasError('max')) {
            return `position must be less than ${this.maxPos} %`;
        }
    }
    /***********************************************************************************************
     * fn          durationErr
     *
     * brief
     *
     */
    durationErr() {
        if(this.durationCtrl.hasError('required')) {
            return 'You must enter a value';
        }
        if(this.durationCtrl.hasError('max')) {
            return `duration must be less than ${this.maxDuration}`;
        }
    }
    /***********************************************************************************************
     * fn          nameChange
     *
     * brief
     *
     */
    nameChange(name) {
        const scroll = this.scrollCtrl.value;
        if(name) {
            if(scroll) {
                scroll.name = name;
            }
        }
    }
    /***********************************************************************************************
     * fn          yPosChange
     *
     * brief
     *
     */
    yPosChange(pos) {
        if(pos > this.maxPos) {
            return;
        }
        this.dlgData.scrollRef.scrollTo({top: (pos * this.dlgData.imgDim.height) / 100});
        const scroll = this.scrollCtrl.value;
        if(scroll) {
            scroll.yPos = pos;
        }
    }
    /***********************************************************************************************
     * fn          durationChange
     *
     * brief
     *
     */
    durationChange(duration) {
        if(duration > this.maxDuration) {
            return;
        }
        const scroll = this.scrollCtrl.value;
        if(scroll) {
            scroll.duration = duration;
        }
    }
    /***********************************************************************************************
     * fn          addScroll
     *
     * brief
     *
     */
    addScroll() {
        const scroll = {} as gIF.scroll_t;
        scroll.name = `new_${this.newIdx}`;
        this.newIdx++;
        scroll.yPos = 0;
        scroll.duration = 200;

        this.scrolls.push(scroll);
        this.scrollCtrl.setValue(scroll);
    }
    /***********************************************************************************************
     * fn          delScroll
     *
     * brief
     *
     */
    delScroll() {
        const scroll = this.scrollCtrl.value;
        let selIdx = this.scrolls.findIndex((item)=>{
            if(item === scroll) {
                return true;
            }
            return false;
        });
        if(selIdx > -1) {
            this.scrolls.splice(selIdx, 1);
            selIdx--;
            if(selIdx === -1) {
                if(this.scrolls.length) {
                    selIdx = 0;
                }
            }
            if(selIdx > -1) {
                this.scrollCtrl.setValue(this.scrolls[selIdx]);
            }
            else {
                this.scrollCtrl.reset();
            }
        }
    }
    /***********************************************************************************************
     * fn          selChanged
     *
     * brief
     *
     */
    selChanged(event) {
        //console.log(event);
    }
}
