class IDBWebStorage{
    dbName = null;

    constructor(dbName){
        this.dbName = dbName;
        this.setup();
    }
    
    setup(){
        return new Promise(async (resolve,reject) => {
            let {dbName} = this;
    
            let openRequest = indexedDB.open(dbName);
            openRequest.onerror = (e) => {
                reject(new IDBWebStorageError(e.result)); 
                return;
            }
    
            openRequest.onupgradeneeded = (e) => {
                if(e.oldVersion == 0){
                    this.db = openRequest.result;
                    this.db.createObjectStore("data");
                }
                else{
                    indexedDB.deleteDatabase(dbName);
                    reject(new IDBWebStorageError("Database was of an unrecoverable version"));
                    return;
                }
            }
            
            openRequest.onsuccess = async (e) => {
                this.db = openRequest.result;
                resolve();
            }
            openRequest.onerror = () => {
                reject(new IDBWebStorageError(openRequest.error));
                return;
            };
        });
    }

    getItem(key){
        return new Promise(async (resolve,reject) => {
            if(!this.db) await this.setup();
            let request;
            try{
                request = this.db.transaction("data","readonly").objectStore("data").get(key);
            }
            catch(e){
                reject(new IDBWebStorageError("Error opening object store\n"+e.message));
                return;
            }
            request.onsuccess = (e) => {
                resolve(request.result);
            }
            request.onerror = (e) => {
                reject(new IDBWebStorageError(request.error));
                return;
            }
        });
    }

    setItem(key,value){
        return new Promise(async (resolve,reject) => {
            if(!this.db) await this.setup();
            let request;
            try{
                request = this.db.transaction("data","readwrite").objectStore("data").put(value,key);
            }
            catch{
                return null;
            }

            request.onsuccess = (e) => {
                resolve();
            }
            request.onerror = (e) => {
                reject(new IDBWebStorageError(request.error));
                return;
            }
        });
    }

    removeItem(key){
        return new Promise(async (resolve,reject) => {
            if(!this.db) await this.setup();
            let request;
            try{
                request = this.db.transaction("data","readwrite").objectStore("data").delete(key);
            }
            catch{
                return null;
            }

            request.onsuccess = (e) => {
                resolve();
            }
            request.onerror = (e) => {
                reject(new IDBWebStorageError(request.error));
                return;
            }
        });
    }

    async clear(){
        indexedDB.deleteDatabase(await this.dbName);
    }

    getLength(){
        return new Promise((resolve,reject) => {
            let request;
            try{
                request = this.db.transaction("data","readwrite").objectStore("data").count();
            }
            catch{
                return null;
            }

            request.onsuccess = (e) => {
                resolve(request.result);
            }
            request.onerror = (e) => {
                reject(new IDBWebStorageError(request.error));
                return;
            }
        });
    }

    length = 0;
    
    get length(){
        return this.getLength();
    }
    
    set length(x){}
}

class IDBWebStorageError extends Error{
    name =  "IDBWebStorageError";
}