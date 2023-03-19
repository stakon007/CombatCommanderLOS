export class JavascriptDataDownloader {

    constructor(data={}, filename) {
        this.data = data;
        this.filename = filename;
    }

    download (type_of = "text/plain", filename= this.filename) {
        let body = document.body;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([JSON.stringify(this.data, null, 0)], {
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

//read the bytes out of a file to be used as image data.
export function fileToDataUri(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
  
      reader.addEventListener("load", () => {
        resolve(reader.result);
      });
  
      reader.readAsDataURL(file);
    });
  }

  //read the text out of a file
 export function fileToText(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
  
      reader.addEventListener("load", () => {
        resolve(reader.result);
      });
  
      reader.readAsText(file);
    });
  }