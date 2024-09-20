from flask import Flask,request
from pathlib import Path
import json
# import stable_diffusion_2_1

index = Path("webui/index.html").read_text().strip()

# generator = stable_diffusion_2_1.Stable21()

app = Flask(__name__)

@app.route("/")
def hello_world():
    return index


@app.route("/submit", methods=['GET', 'POST'])
def submit():
    arg = request.form
    # j=json.load(arg)
    return "<p>{}</p>".format(arg['text'])

@app.route("/image")
def image():
    return "<p>Hello, World!</p>"


if __name__ == '__main__':
      app.run(host='0.0.0.0', port=5000)