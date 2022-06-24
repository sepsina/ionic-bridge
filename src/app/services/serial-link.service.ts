/* eslint-disable object-shorthand */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable @typescript-eslint/prefer-for-of */
/* eslint-disable no-bitwise */
import {Injectable, NgZone} from '@angular/core';
import {EventsService} from './events.service';
import {StorageService} from './storage.service';
import {PortService} from './port.service';
import {UtilsService} from './utils.service';

import {Platform} from '@ionic/angular';

import * as gConst from '../gConst';
import * as gIF from '../gIF';

@Injectable({
    providedIn: 'root',
})
export class SerialLinkService {
    setMap = new Map();

    //delTest: number;

    constructor(
        private storage: StorageService,
        private events: EventsService,
        private ngZone: NgZone,
        private platform: Platform,
        private port: PortService,
        private utils: UtilsService
    ) {
        this.platform.ready().then(() => {
            setTimeout(() => {
                this.initApp();
            }, 100);
        });
    }

    /***********************************************************************************************
     * fn          initApp
     *
     * brief
     *
     */
    initApp() {
        this.storage.readAllKeys().then(() => {
            // ---
        });

        this.events.subscribe('attr_set', (attrSet) => {
            this.ngZone.run(() => {
                this.parseAttrSet(JSON.parse(attrSet));
            });
        });
        this.events.subscribe('src_binds', (binds) => {
            this.addSrcBinds(JSON.parse(binds));
        });

        this.port.openComPort().then(() => {
            // ---
        });

        setTimeout(() => {
            this.cleanAgedAttribs();
        }, 60000);
        setTimeout(() => {
            this.cleanAgedBinds();
        }, 60000);
        setTimeout(() => {
            this.cleanAgedSets();
        }, 60000);
    }

    /***********************************************************************************************
     * fn          parseAttrSet
     *
     * brief
     *
     */
    private parseAttrSet(attrSet: gIF.attrSet_t) {
        if (attrSet.hostShortAddr === undefined) {
            console.log('--- ATTR HOST ADDR UNDEFINED ---');
            return;
        }
        const now = Math.round(Date.now() / 1000);
        const attrSpec = this.getAttrSpec(attrSet);
        for (const spec of attrSpec) {
            //for (let i = 0; i < attrSpec.length; i++) {
            //let spec = attrSpec[i];
            if (spec.isVisible === true) {
                let storedAttr: gIF.storedAttr_t;
                const newVal = {} as gIF.hostedAttr_t;
                newVal.shortAddr = attrSet.shortAddr;
                newVal.endPoint = attrSet.endPoint;
                newVal.clusterID = attrSet.clusterID;
                newVal.attrSetID = attrSet.attrSetID;
                newVal.attrID = spec.attrID;
                const key: string = this.storage.attrKey(newVal);
                const currVal: gIF.hostedAttr_t = this.storage.attrMap.get(key);
                if (currVal) {
                    currVal.timestamp = spec.timestamp;
                    currVal.hostShortAddr = attrSet.hostShortAddr;
                    currVal.partNum = attrSet.partNum;
                    currVal.clusterServer = attrSet.clusterServer;
                    currVal.extAddr = attrSet.extAddr;
                    currVal.isValid = true;
                    currVal.formatedVal = spec.formatedVal;
                    if (spec.hasHistory) {
                        this.dataHistory(spec.timestamp, spec.attrVal, currVal);
                    }
                } else {
                    newVal.drag = false;
                    newVal.isSel = false;
                    newVal.timestamp = now;
                    storedAttr = this.storage.nvAttrMap.get(key);
                    if (storedAttr) {
                        newVal.pos = storedAttr.pos;
                        newVal.name = storedAttr.attrName;
                        newVal.style = storedAttr.style;
                        newVal.valCorr = storedAttr.valCorr;
                    } else {
                        newVal.pos = {x: 0, y: 0};
                        newVal.name = 'no name';
                        newVal.style = gConst.NG_STYLE;
                        newVal.valCorr = {
                            units: gConst.DEG_C,
                            slope: 1,
                            offset: 0,
                        };
                    }
                    newVal.hostShortAddr = attrSet.hostShortAddr;
                    newVal.partNum = attrSet.partNum;
                    newVal.clusterServer = attrSet.clusterServer;
                    newVal.extAddr = attrSet.extAddr;
                    newVal.isValid = true;
                    newVal.isSensor = spec.isSensor;
                    newVal.formatedVal = spec.formatedVal;
                    newVal.timestamps = [];
                    newVal.attrVals = [];
                    if (spec.hasHistory) {
                        this.dataHistory(now, spec.attrVal, newVal);
                    }
                    this.storage.attrMap.set(key, newVal);
                }
                console.log(spec.formatedVal);
            }
        }
    }

    /***********************************************************************************************
     * fn          cleanAgedAttribs
     *
     * brief
     *
     */
    private cleanAgedAttribs() {
        let diff: number;
        const now = Math.round(Date.now() / 1000);
        for (const [key, val] of this.storage.attrMap) {
            diff = now - val.timestamp;
            if (diff > gConst.ATTR_TTL) {
                this.storage.attrMap.delete(key);
            }
            if (diff > gConst.ATTR_VALID_TTL) {
                val.isValid = false;
            }
        }
        setTimeout(() => {
            this.cleanAgedAttribs();
        }, 60000); // 60 seconds
    }

    /***********************************************************************************************
     * fn          addSrcBinds
     *
     * brief
     *
     */
    private addSrcBinds(srcBinds: gIF.srcBinds_t) {
        if (srcBinds.hostShortAddr === undefined) {
            console.log('--- BINDS HOST ADDR UNDEFINED ---');
            return;
        }
        const now = Math.round(Date.now() / 1000);
        let storedBinds: gIF.storedBinds_t;
        const newVal = {} as gIF.hostedBinds_t;
        //let currVal: gIF.hostedBinds_t;
        //let key: string;

        newVal.srcShortAddr = srcBinds.srcShortAddr;
        newVal.srcEP = srcBinds.srcEP;
        newVal.clusterID = srcBinds.clusterID;
        const key = this.storage.bindsKey(newVal);
        const currVal = this.storage.bindsMap.get(key);
        if (currVal) {
            currVal.timestamp = now;
            currVal.partNum = srcBinds.partNum;
            currVal.hostShortAddr = srcBinds.hostShortAddr;
            currVal.extAddr = srcBinds.extAddr;
            currVal.maxBinds = srcBinds.maxBinds;
            currVal.bindsDst = JSON.parse(JSON.stringify(srcBinds.bindsDst));
        } else {
            newVal.timestamp = now;
            storedBinds = this.storage.nvBindsMap.get(key);
            if (storedBinds) {
                newVal.name = storedBinds.bindsName;
            } else {
                newVal.name = 'no name';
            }
            newVal.partNum = srcBinds.partNum;
            newVal.hostShortAddr = srcBinds.hostShortAddr;
            newVal.extAddr = srcBinds.extAddr;
            newVal.maxBinds = srcBinds.maxBinds;
            newVal.bindsDst = JSON.parse(JSON.stringify(srcBinds.bindsDst));
            this.storage.bindsMap.set(key, newVal);
        }
        let logMsg = '';
        logMsg += `rx binds -> hostShortAddr: 0x${srcBinds.hostShortAddr.toString(16).padStart(4, '0').toUpperCase()},`;
        logMsg += ` srcAddr: 0x${srcBinds.srcShortAddr.toString(16).padStart(4, '0').toUpperCase()},`;
        logMsg += ` srcEP: ${srcBinds.srcEP},`;
        logMsg += ` cluster: 0x${srcBinds.clusterID.toString(16).padStart(4, '0').toUpperCase()} -> [`;
        for (let i = 0; i < srcBinds.bindsDst.length; i++) {
            logMsg += ` dstExtAddr: ${this.utils.extToHex(srcBinds.bindsDst[i].dstExtAddr)},`;
            logMsg += ` dstEP: ${srcBinds.bindsDst[i].dstEP}`;
        }
        logMsg += ' ]';
        //let logMsg = sprintf('rx binds -> hostShortAddr: %04X ', srcBinds.hostShortAddr);
        //logMsg += sprintf('srcAddr: %04X ', srcBinds.srcShortAddr);
        //logMsg += sprintf('srcEP: %d ', srcBinds.srcEP);
        //logMsg += sprintf('cluster: %04X -> [ ', srcBinds.clusterID);
        //for (let i = 0; i < srcBinds.bindsDst.length; i++) {
        //    logMsg += sprintf('dstExtAddr: %s ', this.utils.extToHex(srcBinds.bindsDst[i].dstExtAddr));
        //    logMsg += sprintf('dstEP: %d ', srcBinds.bindsDst[i].dstEP);
        //}
        //logMsg += ']';
        console.log(logMsg);
    }

    /***********************************************************************************************
     * fn          cleanAgedBinds
     *
     * brief
     *
     */
    private cleanAgedBinds() {
        let diff: number;
        const now = Math.round(Date.now() / 1000);
        for (const [key, val] of this.storage.bindsMap) {
            diff = now - val.timestamp;
            if (diff > gConst.BINDS_TTL) {
                this.storage.bindsMap.delete(key);
            }
        }
        setTimeout(() => {
            this.cleanAgedBinds();
        }, 60000);
    }

    /***********************************************************************************************
     * fn          wrBinds
     *
     * brief
     *
     */
    public wrBinds(binds: string) {
        this.events.publish('wr_binds', binds);
        //this.port.wrBinds(binds);
    }

    /***********************************************************************************************
     * fn          udpZclCmd
     *
     * brief
     *
     */
    public udpZclCmd(zclCmd: string) {
        this.events.publish('zcl_cmd', zclCmd);
        //this.port.udpZclCmd(zclCmd);
    }

    /***********************************************************************************************
     * fn          getKey
     *
     * brief
     *
     */
    private getKey(attrSet: gIF.attrSet_t, attrID: number) {
        const tmp = {
            shortAddr: attrSet.shortAddr,
            endPoint: attrSet.endPoint,
            clusterID: attrSet.clusterID,
            attrSetID: attrSet.attrSetID,
            attrID: attrID,
        };

        return this.storage.attrKey(tmp);
    }

    /***********************************************************************************************
     * fn          corrVal
     *
     * brief
     *
     */
    private corrVal(val: number, corr: gIF.valCorr_t) {
        switch (corr.units) {
            case gConst.DEG_F: {
                val = (val * 9.0) / 5.0 + 32.0;
                break;
            }
            case gConst.IN_HG: {
                val = val / 33.864;
                break;
            }
        }
        val *= corr.slope;
        val += corr.offset;

        return val;
    }

    /***********************************************************************************************
     * fn          dataHistory
     *
     * brief
     *
     */
    private dataHistory(timestamp: number, val: number, attr: gIF.hostedAttr_t) {
        let len = attr.timestamps.length;
        if (len > 0) {
            const lastTime = attr.timestamps[len - 1];
            if (timestamp - lastTime > 60) {
                attr.timestamps.push(timestamp);
                attr.attrVals.push(val);
                len++;
                if (len > 10) {
                    attr.timestamps.shift();
                    attr.attrVals.shift();
                }
            }
        } else {
            attr.timestamps.push(timestamp);
            attr.attrVals.push(val);
        }
    }

    /***********************************************************************************************
     * fn          getAttrSpec
     *
     * brief
     *
     */
    private getAttrSpec(attrSet: gIF.attrSet_t): gIF.attrSpec_t[] {
        const attrSpecs: gIF.attrSpec_t[] = [];
        const valsBuff = new ArrayBuffer(64);
        const valsData = new Uint8Array(valsBuff);
        for (let i = 0; i < attrSet.valsLen; i++) {
            valsData[i] = attrSet.attrVals[i];
        }
        const valsView = new DataView(valsBuff);
        const now = Math.round(Date.now() / 1000);
        let setVals = {} as any;
        let key: string;
        let nvAttr: gIF.storedAttr_t;
        let spec: gIF.attrSpec_t;
        let formatedVal = '';
        let attrID: number;
        let attrName = '';
        let units: number;
        let idx: number;

        switch (attrSet.partNum) {
            case gConst.HTU21D_005_T: {
                idx = 0;
                let temp = valsView.getInt16(idx, gConst.LE);
                idx += 2;
                temp /= 10.0;
                attrID = 0;
                key = this.getKey(attrSet, attrID);
                nvAttr = this.storage.nvAttrMap.get(key);
                attrName = '';
                units = gConst.DEG_C;
                if (nvAttr) {
                    attrName = nvAttr.attrName;
                    units = nvAttr.valCorr.units;
                    temp = this.corrVal(temp, nvAttr.valCorr);
                    if (units === gConst.DEG_F) {
                        formatedVal = `${temp.toFixed(1)} °F`;
                    } else {
                        formatedVal = `${temp.toFixed(1)} °C`;
                    }
                } else {
                    formatedVal = `${temp.toFixed(1)} °C`;
                }
                setVals = {
                    name: attrName,
                    units: units,
                    t_val: temp,
                };
                spec = {
                    attrID: attrID,
                    isVisible: true,
                    isSensor: true,
                    hasHistory: true,
                    formatedVal: formatedVal,
                    timestamp: now,
                    attrVal: temp,
                };
                attrSpecs.push(spec);
                break;
            }
            case gConst.HTU21D_005_RH: {
                idx = 0;
                let rh = valsView.getUint16(idx, gConst.LE);
                idx += 2;
                rh /= 10.0;
                attrID = 0;
                key = this.getKey(attrSet, attrID);
                nvAttr = this.storage.nvAttrMap.get(key);
                attrName = '';
                if (nvAttr) {
                    attrName = nvAttr.attrName;
                    rh = this.corrVal(rh, nvAttr.valCorr);
                }
                setVals = {
                    name: attrName,
                    rh_val: rh,
                };
                spec = {
                    attrID: attrID,
                    isVisible: true,
                    isSensor: true,
                    hasHistory: true,
                    formatedVal: `${rh.toFixed(0)} %rh`,
                    timestamp: now,
                    attrVal: rh,
                };
                attrSpecs.push(spec);
                break;
            }
            case gConst.HTU21D_005_BAT: {
                idx = 0;
                let batVolt = valsView.getUint8(idx++);
                batVolt /= 10.0;
                attrID = 0;
                key = this.getKey(attrSet, attrID);
                nvAttr = this.storage.nvAttrMap.get(key);
                attrName = '';
                if (nvAttr) {
                    attrName = nvAttr.attrName;
                }
                setVals = {
                    name: attrName,
                    bat_volt: batVolt,
                };
                spec = {
                    attrID: attrID,
                    isVisible: true,
                    isSensor: false,
                    hasHistory: false,
                    formatedVal: `${batVolt.toFixed(1)} V`,
                    timestamp: now,
                    attrVal: batVolt,
                };
                attrSpecs.push(spec);
                break;
            }
            case gConst.BME280_007_T: {
                idx = 0;
                let temp = valsView.getInt16(idx, gConst.LE);
                idx += 2;
                temp /= 10.0;
                attrID = 0;
                key = this.getKey(attrSet, attrID);
                nvAttr = this.storage.nvAttrMap.get(key);
                attrName = '';
                units = gConst.DEG_C;
                if (nvAttr) {
                    attrName = nvAttr.attrName;
                    units = nvAttr.valCorr.units;
                    temp = this.corrVal(temp, nvAttr.valCorr);
                    if (units === gConst.DEG_F) {
                        formatedVal = `${temp.toFixed(1)} °F`;
                    } else {
                        formatedVal = `${temp.toFixed(1)} °C`;
                    }
                } else {
                    formatedVal = `${temp.toFixed(1)} °C`;
                }
                setVals = {
                    name: attrName,
                    units: units,
                    t_val: temp,
                };
                spec = {
                    attrID: attrID,
                    isVisible: true,
                    isSensor: true,
                    hasHistory: true,
                    formatedVal: formatedVal,
                    timestamp: now,
                    attrVal: temp,
                };
                attrSpecs.push(spec);
                break;
            }
            case gConst.BME280_007_RH: {
                idx = 0;
                let rh = valsView.getUint16(idx, gConst.LE);
                idx += 2;
                rh /= 10.0;
                attrID = 0;
                key = this.getKey(attrSet, attrID);
                nvAttr = this.storage.nvAttrMap.get(key);
                attrName = '';
                if (nvAttr) {
                    attrName = nvAttr.attrName;
                    rh = this.corrVal(rh, nvAttr.valCorr);
                }
                setVals = {
                    name: attrName,
                    rh_val: rh,
                };
                spec = {
                    attrID: attrID,
                    isVisible: true,
                    isSensor: true,
                    hasHistory: true,
                    formatedVal: `${rh.toFixed(0)} %rh`,
                    timestamp: now,
                    attrVal: rh,
                };
                attrSpecs.push(spec);
                break;
            }
            case gConst.BME280_007_P: {
                idx = 0;
                let press = valsView.getInt16(idx, gConst.LE);
                idx += 2;
                press /= 10.0;
                attrID = 0;
                key = this.getKey(attrSet, attrID);
                nvAttr = this.storage.nvAttrMap.get(key);
                attrName = '';
                units = gConst.M_BAR;
                if (nvAttr) {
                    attrName = nvAttr.attrName;
                    units = nvAttr.valCorr.units;
                    press = this.corrVal(press, nvAttr.valCorr);
                    if (units === gConst.IN_HG) {
                        formatedVal = `${press.toFixed(1)} mmHg`;
                    } else {
                        formatedVal = `${press.toFixed(1)} mBar`;
                    }
                } else {
                    formatedVal = `${press.toFixed(1)} mBar`;
                }
                setVals = {
                    name: attrName,
                    units: units,
                    p_val: press,
                };
                spec = {
                    attrID: attrID,
                    isVisible: true,
                    isSensor: true,
                    hasHistory: true,
                    formatedVal: formatedVal,
                    timestamp: now,
                    attrVal: press,
                };
                attrSpecs.push(spec);
                break;
            }
            case gConst.BME280_007_BAT: {
                idx = 0;
                let batVolt = valsView.getUint8(idx++);
                batVolt /= 10.0;
                attrID = 0;
                key = this.getKey(attrSet, attrID);
                nvAttr = this.storage.nvAttrMap.get(key);
                attrName = '';
                if (nvAttr) {
                    attrName = nvAttr.attrName;
                }
                setVals = {
                    name: attrName,
                    bat_volt: batVolt,
                };
                spec = {
                    attrID: attrID,
                    isVisible: true,
                    isSensor: false,
                    hasHistory: false,
                    formatedVal: `${batVolt.toFixed(1)} V`,
                    timestamp: now,
                    attrVal: batVolt,
                };
                attrSpecs.push(spec);
                break;
            }
            case gConst.SSR_009_RELAY: {
                idx = 0;
                const state = valsView.getUint8(idx++);
                attrID = 0;
                key = this.getKey(attrSet, attrID);
                nvAttr = this.storage.nvAttrMap.get(key);
                attrName = '';
                if (nvAttr) {
                    attrName = nvAttr.attrName;
                }
                setVals = {
                    name: attrName,
                    state: state,
                    level: 0xff,
                };
                spec = {
                    attrID: attrID,
                    isVisible: true,
                    isSensor: false,
                    hasHistory: true,
                    formatedVal: !!state ? 'on' : 'off',
                    timestamp: now,
                    attrVal: state,
                };
                attrSpecs.push(spec);
                break;
            }
            case gConst.ACUATOR_010_ON_OFF: {
                idx = 0;
                const state = valsView.getUint8(idx++);
                const level = valsView.getUint8(idx++);
                attrID = 0;
                key = this.getKey(attrSet, attrID);
                nvAttr = this.storage.nvAttrMap.get(key);
                attrName = '';
                if (nvAttr) {
                    attrName = nvAttr.attrName;
                }
                formatedVal = 'off';
                if (!!state) {
                    formatedVal = `on (${level}%)`;
                }
                setVals = {
                    name: attrName,
                    state: state,
                    level: level,
                };
                spec = {
                    attrID: attrID,
                    isVisible: true,
                    isSensor: false,
                    hasHistory: true,
                    formatedVal: formatedVal,
                    timestamp: now,
                    attrVal: state,
                };
                attrSpecs.push(spec);
                break;
            }
            case gConst.DBL_SW_008_BAT: {
                idx = 0;
                let batVolt = valsView.getUint8(idx++);
                batVolt /= 10.0;
                attrID = 0;
                key = this.getKey(attrSet, attrID);
                nvAttr = this.storage.nvAttrMap.get(key);
                attrName = '';
                if (nvAttr) {
                    attrName = nvAttr.attrName;
                }
                setVals = {
                    name: attrName,
                    bat_volt: batVolt,
                };
                spec = {
                    attrID: attrID,
                    isVisible: true,
                    isSensor: false,
                    hasHistory: false,
                    formatedVal: `${batVolt.toFixed(1)} V`,
                    timestamp: now,
                    attrVal: batVolt,
                };
                attrSpecs.push(spec);
                break;
            }
        }
        const hostedSet = {
            timestamp: now,
            hostShortAddr: attrSet.hostShortAddr,
            partNum: attrSet.partNum,
            extAddr: attrSet.extAddr,
            shortAddr: attrSet.shortAddr,
            endPoint: attrSet.endPoint,
            clusterID: attrSet.clusterID,
            attrSetID: attrSet.attrSetID,
            setVals: setVals,
        };
        key = this.attrSetKey(hostedSet);
        this.setMap.set(key, hostedSet);

        return attrSpecs;
    }

    /***********************************************************************************************
     * fn          attrSetKey
     *
     * brief
     *
     */
    attrSetKey(params: any) {
        let key = 'set-';
        key += ('000' + params.shortAddr.toString(16)).slice(-4).toUpperCase() + ':';
        key += ('0' + params.endPoint.toString(16)).slice(-2).toUpperCase() + ':';
        key += ('000' + params.clusterID.toString(16)).slice(-4).toUpperCase() + ':';
        key += ('000' + params.attrSetID.toString(16)).slice(-4).toUpperCase();

        return key;
    }

    /***********************************************************************************************
     * fn          cleanAgedSets
     *
     * brief
     *
     */
    private cleanAgedSets() {
        let diff: number;
        const now = Math.round(Date.now() / 1000);
        for (const [key, val] of this.setMap) {
            diff = now - val.timestamp;
            if (diff > gConst.SET_TTL) {
                this.setMap.delete(key);
            }
        }
        setTimeout(() => {
            this.cleanAgedSets();
        }, 60000); // 60 seconds
    }
}
