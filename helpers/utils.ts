import fs from "node:fs/promises";
import path from "node:path";
const { readdir } = require('fs/promises');

export default {
    name: "Utils",
    
    uploadPath: {
        "Others": "uploads/Others",
        "Wheels": "uploads/Wheels",
        "General": "uploads/General",
        "360Open": "uploads/360Open",
        "360Close": "uploads/360Close"
    },
    
    jsonParse(data: string): object {
        return JSON.parse(data);
    },

    jsonParseArray(data: string): Array<any> {
        if(data) {
            return JSON.parse(data);
        }
        return [];
    },

    jsonStringify(data: object): string {
        return JSON.stringify(data, (key, value) => 
            typeof value == 'bigint'
            ? Number(value)
            : value
        );
    },

    createObject(key: any, value: any): object {
        return {
            "key": key,
            "message": value
        }
    },

    response200(message: string, data: object): Array<any> {
        return [200, {
            "status": true,
            "message": message,
            "data": data
        }]
    },

    response400(error: object): Array<any> {
        return [400, {
            "status": false,
            "message": "Bad request to API endpoint",
            "errors": error
        }]
    },

    response403(message: string, errors: object): Array<any> {
        return [403, {
            "status": false,
            "message": message,
            "errors": errors
        }]
    },

    response406(message: string, errors: object): Array<any> {
        return [406, {
            "status": false,
            "message": message,
            "errors": errors
        }]
    },

    getEnumValues(enumType: Record<string, string>): Array<string> {
        return Object.values(enumType);
    },

    generateFrontEndURL(type: string, email: string, token: string): string {
        return `${process.env.FRONTEND_URL}/${type}?email=${email}&token=${token}`
    },

    groupBy(objectArray: Array<any>, property: string): Array<object> {
        let allKeys: Array<string> = [];
        objectArray.filter(function (obj) {
            if(!allKeys.includes(obj[property])) {
                allKeys.push(obj[property]);
            }
        });

        let returnObj = Object();
        for(let i of allKeys) {
            returnObj[i] = [];
        }

        objectArray.filter(function (obj) {
            returnObj[`${obj[property]}`].push(obj);
        });

        return returnObj;
    },

    dateSerializer(dateString: string): Date {
        try {
            return new Date(dateString)
        }
        catch(e) {
            return new Date()
        }
    },

    delayForNetworkTesting(ms: number) {
        return new Promise( resolve => setTimeout(resolve, ms) );
    },

    async saveFile(relativePath: string, id: Number, name: string, buffer: Buffer): Promise<Error | null> {
        let error: Error | null = null;
        try {
            let currentDir = __dirname.split("/");
            currentDir.pop();
            let rootDir = currentDir.join("/");
            let absPath = path.join(rootDir, relativePath);
            let files = await readdir(absPath);
            
            for (let file of files) {
                let fileName = path.basename(file);
                let fileNameWithoutExtension = fileName.split(".")[0].split("-")[1];
                if(fileName.startsWith(`${id}-`) && fileNameWithoutExtension == name) {
                    await fs.unlink(path.join(relativePath, file));
                    break;
                }
            }
            await fs.writeFile(`${absPath}/${name}`, buffer, 'binary');
        }
        catch(e) {
            error = e;
        }
        return error;
    },

    async findFiles(dir: string, id: number) {
        let matchedFiles = [];
        let currentDir = __dirname.split("/");
        currentDir.pop();
        let rootDir = currentDir.join("/");

        try {
            let files = await readdir(path.join(rootDir, dir));
            for (let file of files) {
                let fileName = path.basename(file)
                if(fileName.startsWith(`${id}-`)) {
                    matchedFiles.push(`${dir}/${fileName}`);
                }
            }
        }
        catch(e) {
            // pass
        }
        
        return matchedFiles;
    },

    async removeFiles(id: number) {
        try {
            let directories = [
                "uploads/Wheels", 
                "uploads/Others", 
                "uploads/360Open", 
                "uploads/General", 
                "uploads/360Close" 
            ]

            let currentDir = __dirname.split("/");
            currentDir.pop();
            let rootDir = currentDir.join("/");

            for(let dir in directories) {
                let absPath = path.join(rootDir, directories[dir]);
                let files = await readdir(absPath);
                for (let file of files) {
                    let fileName = path.basename(file);
                    if(fileName.startsWith(`${id}-`)) {
                        await fs.unlink(path.join(absPath, file));
                    }
                }
            }
        }
        catch(e) {
            console.log(e);
        }
    },

    async removeSelectiveFiles(filenames: Array<string>, relativePath: string | null, id: number | null) {
        try {
            let directories = [
                "uploads/Wheels", 
                "uploads/Others", 
                "uploads/360Open", 
                "uploads/General", 
                "uploads/360Close" 
            ]

            let currentDir = __dirname.split("/");
            currentDir.pop();
            let rootDir = currentDir.join("/");

            if(relativePath && id) {
                let absPath = path.join(rootDir, relativePath);
                let files = await readdir(absPath);
                for (let file of files) {
                    let fileName = path.basename(file);
                    if(fileName.startsWith(`${id}-`)) {
                        await fs.unlink(path.join(absPath, file));
                    }
                }
            }
            else {
                for(let dir in directories) {
                    let absPath = path.join(rootDir, directories[dir]);
                    let files = await readdir(absPath);
                    for (let file of files) {
                        let fileName = path.basename(file);
                        if(filenames.includes(fileName)) {
                            await fs.unlink(path.join(absPath, file));
                            if(fileName.includes("-open-")) {
                                let filteredFiles = files.filter((item) => item.includes(`${fileName.split("-")[0]}-`) && !filenames.includes(item));
                                filteredFiles.sort((item1, item2) => Number(item1.split("-")[item1.split("-").length - 1].split(".")[0]) > Number(item2.split("-")[item2.split("-").length - 1].split(".")[0]) ? 1 : Number(item2.split("-")[item2.split("-").length - 1].split(".")[0]) > Number(item1.split("-")[item1.split("-").length - 1].split(".")[0]) ? -1 : 0);
                                let delta = 360 / (filteredFiles.length);
                                let modFiles = await readdir(absPath);
                                for (let modFile of modFiles) {
                                    if(filteredFiles.includes(modFile)) {
                                        for(let index in filteredFiles) {
                                            let newExtension = filteredFiles[index].split(".")[filteredFiles[index].split(".").length - 1];
                                            let newFileName = `${filteredFiles[index].split("-")[0]}-open-${Number(delta * Number(index)).toFixed(0)}.${newExtension}`;
                                            await fs.rename(`${rootDir}/${this.uploadPath["360Open"]}/${filteredFiles[index]}`, `${rootDir}/${this.uploadPath["360Open"]}/${newFileName}`);
                                        }
                                        break;
                                    }
                                }
                            }
                            else if(fileName.includes("-close-")) {
                                let filteredFiles = files.filter((item) => item.includes(`${fileName.split("-")[0]}-`) && !filenames.includes(item));
                                filteredFiles.sort((item1, item2) => Number(item1.split("-")[item1.split("-").length - 1].split(".")[0]) > Number(item2.split("-")[item2.split("-").length - 1].split(".")[0]) ? 1 : Number(item2.split("-")[item2.split("-").length - 1].split(".")[0]) > Number(item1.split("-")[item1.split("-").length - 1].split(".")[0]) ? -1 : 0);
                                let delta = 360 / (filteredFiles.length);
                                let modFiles = await readdir(absPath);
                                for (let modFile of modFiles) {
                                    if(filteredFiles.includes(modFile)) {
                                        for(let index in filteredFiles) {
                                            let newExtension = filteredFiles[index].split(".")[filteredFiles[index].split(".").length - 1];
                                            let newFileName = `${filteredFiles[index].split("-")[0]}-close-${Number(delta * Number(index)).toFixed(0)}.${newExtension}`;
                                            await fs.rename(`${rootDir}/${this.uploadPath["360Close"]}/${filteredFiles[index]}`, `${rootDir}/${this.uploadPath["360Close"]}/${newFileName}`);
                                        }
                                        break;
                                    }
                                }
                            }
                            continue;
                        }
                    }
                }
            }
        }
        catch(e) {
            console.log(e);
        }
    },

    async updateFile(oldFile: string, buffer: Buffer): Promise<Error | null>  {
        try {
            let error: Error | null = null;
            let directories = [
                "uploads/Wheels", 
                "uploads/Others", 
                "uploads/360Open", 
                "uploads/General", 
                "uploads/360Close" 
            ]

            let currentDir = __dirname.split("/");
            currentDir.pop();
            let rootDir = currentDir.join("/");

            for(let dir in directories) {
                let absPath = path.join(rootDir, directories[dir]);
                let files = await readdir(absPath);
                for (let file of files) {
                    let fileName = path.basename(file);
                    if(fileName == oldFile) {
                        await fs.unlink(path.join(absPath, file));
                        try {
                            fs.writeFile(`${absPath}/${oldFile}`, buffer, 'binary');
                        }
                        catch(e) {
                            error = e;
                        }
                        finally {
                            break;
                        }
                    }
                    continue;
                }
            }

            return error;
        }
        catch(e) {
            console.log(e);
        }
    }
}