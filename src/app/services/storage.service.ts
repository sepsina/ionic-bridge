import {Injectable} from '@angular/core';
//import { Storage } from '@ionic/storage-angular';
import {NativeStorage} from '@ionic-native/native-storage/ngx';
import {Platform} from '@ionic/angular';

//import * as CordovaSQLiteDriver from 'localforage-cordovasqlitedriver'

//import * as gConst from './gConst';
import * as gIF from '../gIF';

@Injectable({
    providedIn: 'root',
})
export class StorageService {
    attrMap = new Map();
    bindsMap = new Map();

    nvAttrMap = new Map();
    nvBindsMap = new Map();

    constructor(private nativeStorage: NativeStorage, private platform: Platform) {
        this.platform.ready().then(() => {
            setTimeout(() => {
                this.init();
            }, 100);
        });
    }

    init() {
        this.nativeStorage.clear(); // *** TEST ***
        // ---
    }

    /***********************************************************************************************
     * fn          readAllKeys
     *
     * brief
     *
     */
    async readAllKeys() {
        const keys = await this.nativeStorage.keys();
        if (keys) {
            for (const key of keys) {
                const val = await this.nativeStorage.getItem(key);
                if (val) {
                    if (key.slice(0, 4) === 'attr') {
                        this.nvAttrMap.set(key, val);
                    }
                    if (key.slice(0, 5) === 'binds') {
                        this.nvBindsMap.set(key, val);
                    }
                }
            }
        }
    }

    /***********************************************************************************************
     * fn          setAttrNameAndStyle
     *
     * brief
     *
     *
    setAttrNameAndStyle(name: string,
                        style: gIF.ngStyle_t,
                        attr: gIF.hostedAttr_t): Promise<gIF.storedAttr_t> {

        return new Promise((resolve, reject)=>{
            const key = this.attrKey(attr);
            const val: gIF.hostedAttr_t = this.attrMap.get(key);
            if(val){
                let storedAttr = {} as gIF.storedAttr_t;
                storedAttr.attrName = name;
                storedAttr.pos = val.pos;
                storedAttr.style = style;
                this.storage.set(key, JSON.stringify(storedAttr)).then(()=>{
                    val.name = name;
                    val.style = style;
                    this.nvAttrMap.set(key, storedAttr);
                    resolve(storedAttr);
                }).catch((err)=>{
                    reject(err);
                });
            }
            else {
                console.log('NO VALID ATTR');
                reject(new Error('No valid attr'));
            }
        });
     }
    */
    /***********************************************************************************************
     * fn          setAttrNameAndStyle
     *
     * brief
     *
     */
    setAttrNameAndStyle(name: string, style: gIF.ngStyle_t, valCorr: gIF.valCorr_t, keyVal: any): Promise<gIF.storedAttr_t> {
        return new Promise((resolve, reject) => {
            const key: string = keyVal.key;
            const selAttr: gIF.hostedAttr_t = keyVal.value;
            const storedAttr = {} as gIF.storedAttr_t;
            storedAttr.attrName = name;
            storedAttr.pos = selAttr.pos;
            storedAttr.style = style;
            storedAttr.valCorr = valCorr;
            this.nativeStorage.setItem(key, storedAttr).then(
                () => {
                    selAttr.name = name;
                    selAttr.style = style;
                    selAttr.valCorr = valCorr;
                    this.nvAttrMap.set(key, storedAttr);
                    resolve(storedAttr);
                },
                (err) => {
                    reject(err);
                }
            );
        });
    }

    /***********************************************************************************************
     * fn          setAttrPos
     *
     * brief
     *
     *
    setAttrPos(pos: gIF.nsPos_t,
               attr: gIF.hostedAttr_t): Promise<gIF.storedAttr_t>{

        return new Promise((resolve, reject)=>{
            const key = this.attrKey(attr);
            const val: gIF.hostedAttr_t = this.attrMap.get(key);
            if(val){
                let storedAttr = {} as gIF.storedAttr_t;
                storedAttr.attrName = val.name;
                storedAttr.pos = pos;
                storedAttr.style = val.style;
                this.storage.set(key, JSON.stringify(storedAttr)).then(()=>{
                    val.pos = pos;
                    this.nvAttrMap.set(key, storedAttr);
                    resolve(storedAttr);
                }).catch((err)=>{
                    reject(err);
                });
            }
            else {
                console.log('NO VALID ATTR');
                reject(new Error('No valid attr'));
            }
        });
    }
    */
    /***********************************************************************************************
     * fn          setAttrPos
     *
     * brief
     *
     */
    setAttrPos(pos: gIF.nsPos_t, keyVal: any): Promise<gIF.storedAttr_t> {
        return new Promise((resolve, reject) => {
            const key: string = keyVal.key;
            const selAttr: gIF.hostedAttr_t = keyVal.value;
            const storedAttr = {} as gIF.storedAttr_t;
            storedAttr.attrName = selAttr.name;
            storedAttr.pos = pos;
            storedAttr.style = selAttr.style;
            storedAttr.valCorr = selAttr.valCorr;
            this.nativeStorage.setItem(key, storedAttr).then(
                () => {
                    selAttr.pos = pos;
                    this.nvAttrMap.set(key, storedAttr);
                    resolve(storedAttr);
                },
                (err) => {
                    reject(err);
                }
            );
            /*this.storage.set(key, storedAttr).then(()=>{
                selAttr.pos = pos;
                this.nvAttrMap.set(key, storedAttr);
                resolve(storedAttr);
            }).catch((err)=>{
                reject(err);
            });*/
        });
    }

    /***********************************************************************************************
     * fn          delStoredAttr
     *
     * brief
     *
     */
    delStoredAttr(attr: gIF.hostedAttr_t) {
        return new Promise((resolve, reject) => {
            const key = this.attrKey(attr);
            this.nativeStorage.remove(key).then(
                () => {
                    this.attrMap.delete(key);
                    this.nvAttrMap.delete(key);
                    resolve(key);
                },
                (err) => {
                    reject(err);
                }
            );
            //await this.storage.remove(key);
        });
    }

    /***********************************************************************************************
     * fn          attrKey
     *
     * brief
     *
     */
    attrKey(params: any) {
        let key = 'attr-';
        key += ('000' + params.shortAddr.toString(16)).slice(-4).toUpperCase() + ':';
        key += ('0' + params.endPoint.toString(16)).slice(-2).toUpperCase() + ':';
        key += ('000' + params.clusterID.toString(16)).slice(-4).toUpperCase() + ':';
        key += ('000' + params.attrSetID.toString(16)).slice(-4).toUpperCase() + ':';
        key += ('000' + params.attrID.toString(16)).slice(-4).toUpperCase();

        return key;
    }

    /***********************************************************************************************
     * fn          setBindsName
     *
     * brief
     *
     */
    setBindsName(name: string, binds: gIF.hostedBinds_t): Promise<gIF.storedBinds_t> {
        return new Promise((resolve, reject) => {
            const key = this.bindsKey(binds);
            const val: gIF.hostedBinds_t = this.bindsMap.get(key);
            if (val) {
                const storedBinds = {} as gIF.storedBinds_t;
                storedBinds.bindsName = name;
                this.nativeStorage.setItem(key, storedBinds).then(
                    () => {
                        val.name = name;
                        this.nvBindsMap.set(key, storedBinds);
                        resolve(storedBinds);
                    },
                    (err) => {
                        reject(err);
                    }
                );
                /*this.storage.set(key, storedBinds).then(()=>{
                    val.name = name;
                    this.nvBindsMap.set(key, storedBinds);
                    resolve(storedBinds);
                }).catch((err)=>{
                    reject(err);
                });*/
            } else {
                console.log('NO VALID BINDS');
                reject(new Error('No valid binds'));
            }
        });
    }

    /***********************************************************************************************
     * fn          delStoredBinds
     *
     * brief
     *
     */
    delStoredBinds(binds: gIF.hostedBinds_t) {
        return new Promise((resolve, reject) => {
            const key = this.bindsKey(binds);
            this.nativeStorage.remove(key).then(
                () => {
                    this.bindsMap.delete(key);
                    this.nvBindsMap.delete(key);
                    resolve(key);
                },
                (err) => {
                    reject(err);
                }
            );
            //await this.storage.remove(key);
        });
    }

    /***********************************************************************************************
     * fn          bindsKey
     *
     * brief
     *
     */
    bindsKey(binds: gIF.hostedBinds_t) {
        let key = 'binds-';
        key += ('000' + binds.srcShortAddr.toString(16)).slice(-4).toUpperCase() + ':';
        key += ('0' + binds.srcEP.toString(16)).slice(-2).toUpperCase() + ':';
        key += ('000' + binds.clusterID.toString(16)).slice(-4).toUpperCase();

        return key;
    }

    /***********************************************************************************************
     * fn          setScrolls
     *
     * brief
     *
     */
    setScrolls(scrolls: gIF.scroll_t[]) {
        return new Promise((resolve, reject) => {
            this.nativeStorage.setItem('scrolls', JSON.stringify(scrolls)).then(
                () => {
                    resolve('OK');
                },
                (err) => {
                    reject(err);
                }
            );
        });
        //await this.storage.set('scrolls', JSON.stringify(scrolls));
    }
    /***********************************************************************************************
     * fn          getScrolls
     *
     * brief
     *
     */
    getScrolls(): Promise<string> {
        return new Promise((resolve, reject) => {
            this.nativeStorage.getItem('scrolls').then(
                (scrolls) => {
                    resolve(scrolls);
                },
                (err) => {
                    reject(err);
                }
            );
            /*this.storage.get('scrolls').then((scrolls)=>{
                resolve(scrolls);
            }).catch((err)=>{
                console.log('get scrolls err: ' + err.code);
                reject(err);
            });*/
        });
    }

    /***********************************************************************************************
     * fn          setPublicIP
     *
     * brief
     *
     */
    setPublicIP(ip: string) {
        return new Promise((resolve, reject) => {
            this.nativeStorage.setItem('public-ip', ip).then(
                () => {
                    resolve('OK');
                },
                (err) => {
                    reject(err);
                }
            );
        });
        //await this.storage.set('public-ip', ip);
    }
    /***********************************************************************************************
     * fn          getPublicIP
     *
     * brief
     *
     */
    getPublicIP(): Promise<string> {
        return new Promise((resolve, reject) => {
            this.nativeStorage.getItem('public-ip').then(
                (ip) => {
                    resolve(ip);
                },
                (err) => {
                    reject(err);
                }
            );
            /*this.storage.get('public-ip').then((ip)=>{
                resolve(ip);
            }).catch((err)=>{
                console.log('get scrolls err: ' + err.code);
                reject(err);
            });*/
        });
    }

    /***********************************************************************************************
     * fn          setFreeDNS
     *
     * brief
     *
     */
    setFreeDNS(dns: gIF.dns_t) {
        return new Promise((resolve, reject) => {
            this.nativeStorage.setItem('free-dns', dns).then(
                () => {
                    resolve('OK');
                },
                (err) => {
                    reject(err);
                }
            );
        });
        //await this.storage.set('free-dns', dns);
    }
    /***********************************************************************************************
     * fn          getFreeDNS
     *
     * brief
     *
     */
    getFreeDNS(): Promise<gIF.dns_t> {
        return new Promise((resolve, reject) => {
            this.nativeStorage.getItem('free-dns').then(
                (dns) => {
                    resolve(dns);
                },
                (err) => {
                    reject(err);
                }
            );
            /*this.storage.get('free-dns').then((dns: gIF.dns_t)=>{
                resolve(dns);
            }).catch((err)=>{
                console.log('get scrolls err: ' + err.code);
                reject(err);
            });*/
        });
    }

    /***********************************************************************************************
     * fn          extToHex
     *
     * brief
     *
     */
    private extToHex(extAddr: number) {
        const ab = new ArrayBuffer(8);
        const dv = new DataView(ab);
        dv.setFloat64(0, extAddr);
        const extHex = [];
        for (let i = 0; i < 8; i++) {
            extHex[i] = ('0' + dv.getUint8(i).toString(16)).slice(-2);
        }
        return extHex.join(':');
    }
}
