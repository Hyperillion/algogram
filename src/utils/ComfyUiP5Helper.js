// gohai (Gottfried Haider), NYU Shanghai

class ComfyUiP5Helper {
    constructor(base_url) {
        this.base_url = base_url.replace(/\/$/, ""); // strip any trailing slash
        this.setup_websocket();
        this.outputs = [];
    }

    setup_websocket() {
        this.sid = null;
        this.ws = new WebSocket(this.base_url + "/ws");
        this.ws.addEventListener("message", this.websocket_on_message.bind(this));

        // this.ws.onopen = () => {
        //   console.log("WebSocket is open now.");
        // };
        this.ws.onclose = () => {
            console.log("WebSocket is closed now.");
            setTimeout(() => {
                this.setup_websocket();
            }, 5000);
        }
    };

    websocket_on_message(event) {
        console.log("WS MSG:", event.data);
        if (typeof event.data == "string") {
            const data = JSON.parse(event.data);
            console.log("WS JSON MSG:", data);
            if (data.type == "status") {
                // ComfyUI sends the client id (once) after establishing the connection
                if (data.data.sid && !this.sid) {
                    this.sid = data.data.sid;
                }
            } else if (data.type == "execution_start") {
                if (data.data.prompt_id == this.prompt_id) {
                    //console.log("Execution starts");
                }
            } else if (data.type == "progress") {
                // this is being sent periodically during processing
                this.current_prompt = data.data.prompt_id;
                this.current_node = data.data.node;
            } else if (data.type == "execution_success") {
                if (data.data.prompt_id == this.prompt_id) {
                    //console.log("Execution finished");
                    if (this.callback) {
                        this.callback(this.outputs);
                    }
                    this.resolve(this.outputs);
                    this.outputs = [];
                }
            } else if (data.type == "execution_interrupted") {
                console.warn("Execution was interrupted");
                if (this.callback) {
                    this.callback([], "Execution was interrupted");
                }
                this.reject("Execution was interrupted");
                this.outputs = [];
            } else if (data.type == "execution_error") {
                console.warn(data);
                if (this.callback) {
                    this.callback([], "Error during execution");
                }
                this.reject("Error during execution");
            } else {
                //console.log(data);
            }
        }

        if (event.data instanceof Blob) {
            console.log("WS got blob", event.data);
            if (this.current_prompt == this.prompt_id) {
                const blob_url = URL.createObjectURL(event.data.slice(8));
                console.log("Blob url:", blob_url);
                this.outputs.push({
                    node: parseInt(this.current_node),
                    src: blob_url,
                });
            }else{
                console.log("Blob not for this prompt:", this.current_prompt, this.prompt_id);
            }
        }
    }

    replace_saveimage_with_websocket(workflow) {
        for (let key in workflow) {
            if (workflow[key].class_type == "SaveImage") {
                workflow[key].class_type = "SaveImageWebsocket";
            }
        }
    }

    async run(workflow, callback) {
        this.replace_saveimage_with_websocket(workflow);
        this.callback = callback;
        // console.log(workflow);
        this.prompt_id = await this.prompt(workflow);
        return new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }

    async prompt(workflow) {
        let options = {
            method: "POST",
            body: JSON.stringify({ prompt: workflow, client_id: this.sid }),
            headers: {
                "Content-Type": "application/json",
            },
            redirect: "follow",
        };

        try {
            let res = await fetch(this.base_url + "/prompt", options);
            let data = await res.json();
            if (res.status !== 200) {
                if (data.error) {
                    throw (
                        data.error.type +
                        ": " +
                        data.error.message +
                        " (" +
                        data.error.details +
                        ")"
                    );
                } else {
                    throw "Status " + res.status;
                }
            }
            return data.prompt_id;
        } catch (e) {
            console.warn(e);
            throw e;
        }
    }

    image(img) {
        if (img.loadPixels) {
            img.loadPixels();
            let data_url = img.canvas.toDataURL();
        } else {
            throw "image() is currently only implemented for p5 images";
        }
        return {
            inputs: {
                image: data_url.split("base64,")[1],
            },
            class_type: "ETN_LoadImageBase64",
            _meta: {
                title: "Load Image (Base64)",
            },
        };
    }

    mask(img) {
        if (img.loadPixels) {
            img.loadPixels();
            let data_url = img.canvas.toDataURL();
        } else {
            throw "image() is currently only implemented for p5 images";
        }
        return {
            inputs: {
                image: data_url.split("base64,")[1],
            },
            class_type: "ETN_LoadMaskBase64",
            _meta: {
                title: "Load Mask (Base64)",
            },
        };
    }
}

export default ComfyUiP5Helper;