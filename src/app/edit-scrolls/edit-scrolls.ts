/* eslint-disable @typescript-eslint/prefer-for-of */
/* eslint-disable @angular-eslint/component-class-suffix */
import { Component, Inject, OnInit, AfterViewInit, ViewChild, NgZone } from '@angular/core';
import { SerialLinkService } from '../services/serial-link.service';
import { EventsService } from '../services/events.service';
import { Validators, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import * as gIF from '../gIF';

@Component({
    selector: 'app-edit-scrolls',
    templateUrl: './edit-scrolls.html',
    styleUrls: ['./edit-scrolls.css'],
})
export class EditScrolls implements OnInit, AfterViewInit {

    @ViewChild('selList') selList;

    minPos = 0;
    maxPos = 100;
    maxDuration = 2000;

    scrollFormCtrl = new FormControl('', Validators.required);

    scrolls: gIF.scroll_t[] = [];
    newIdx = 0;

    nameFormCtrl = new FormControl('', Validators.required);
    yPosFormCtrl = new FormControl(0, [Validators.required, Validators.max(this.maxPos)]);
    durationFormCtrl = new FormControl(0, [Validators.required, Validators.max(this.maxDuration)]);

    constructor(public dialogRef: MatDialogRef<EditScrolls>,
                @Inject(MAT_DIALOG_DATA) public dlgData: any,
                public serialLink: SerialLinkService,
                public events: EventsService,
                public ngZone: NgZone) {
        // ---
    }

    /***********************************************************************************************
     * fn          ngOnInit
     *
     * brief
     *
     */
    ngOnInit(): void {
        for(let i = 0; i < this.dlgData.scrolls.length; i++){
            const scroll = {} as gIF.scroll_t;
            scroll.name = this.dlgData.scrolls[i].name;
            scroll.yPos = this.dlgData.scrolls[i].yPos;
            scroll.duration = this.dlgData.scrolls[i].duration;
            this.scrolls.push(scroll);
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
                this.ngZone.run(()=>{
                    this.scrollFormCtrl.setValue(scroll);
                    this.nameFormCtrl.setValue(scroll.name);
                    this.yPosFormCtrl.setValue(scroll.yPos);
                    this.durationFormCtrl.setValue(scroll.duration);
                    this.yPosSet(scroll.yPos);
                });
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
        if(this.nameFormCtrl.hasError('required')) {
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
        if(this.yPosFormCtrl.hasError('required')) {
            return 'You must enter a value';
        }
        if(this.yPosFormCtrl.hasError('max')) {
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
        if(this.durationFormCtrl.hasError('required')) {
            return 'You must enter a value';
        }
        if(this.durationFormCtrl.hasError('max')) {
            return `duration must be less than ${this.maxDuration}`;
        }
    }
    /***********************************************************************************************
     * fn          nameChange
     *
     * brief
     *
     */
    nameChange(event) {
        const name = event.target.value;
        const scroll = this.scrollFormCtrl.value;
        if(name){
            if(scroll){
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
    yPosChange(event) {

        const pos = event.target.value;

        this.yPosSet(pos);
    }

    /***********************************************************************************************
     * @fn          yPosChange
     *
     * @brief
     *
     */
    yPosSet(pos: number) {

        if(pos < 0){
            pos = 0;
            this.yPosFormCtrl.setValue(0);
        }

        if(pos > this.maxPos){
            return;
        }
        this.dlgData.scrollRef.scrollTo({top: (pos * this.dlgData.imgDim.height) / 100});
        const scroll = this.scrollFormCtrl.value;
        if(scroll){
            scroll.yPos = pos;
        }
    }

    /***********************************************************************************************
     * fn          durationChange
     *
     * brief
     *
     */
    durationChange(event) {

        let duration = event.target.value;

        if(duration < 0){
            duration = 0;
        }

        if(duration > this.maxDuration){
            return;
        }
        const scroll = this.scrollFormCtrl.value;
        if(scroll){
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
        this.scrollFormCtrl.setValue(scroll);
    }
    /***********************************************************************************************
     * fn          delScroll
     *
     * brief
     *
     */
    delScroll() {

        const scroll = this.scrollFormCtrl.value;

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
                this.scrollFormCtrl.setValue(this.scrolls[selIdx]);
                this.yPosSet(this.scrolls[selIdx].yPos);
            }
            else {
                this.scrollFormCtrl.reset();
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
        this.yPosSet(event.value.yPos);
    }

    /***********************************************************************************************
     * @fn          isInvalid
     *
     * @brief
     *
     */
    isInvalid(){

        if(this.nameFormCtrl.invalid){
            return true;
        }
        if(this.yPosFormCtrl.invalid){
            return true;
        }
        if(this.durationFormCtrl.invalid){
            return true;
        }
        return false;
    }
}
