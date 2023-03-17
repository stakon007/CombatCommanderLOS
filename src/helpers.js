export class JavascriptDataDownloader {

    constructor(data={}, filename) {
        this.data = data;
        this.filename = filename;
    }

    download (type_of = "text/plain", filename= this.filename) {
        let body = document.body;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([JSON.stringify(this.data, null, 1)], {
            type: type_of
        }));
        a.setAttribute("download", filename);
        body.appendChild(a);
        a.click();
        body.removeChild(a);
    }
} 

//usage
//new JavascriptDataDownloader({"greetings": "Hello World"}).download();