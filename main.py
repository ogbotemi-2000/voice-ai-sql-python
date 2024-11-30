
#!/usr/bin/env python
# -*- coding: utf-8 -*-

from flask import Response, Flask, render_template, request, jsonify
import json
import base64
import os
from dotenv import dotenv_values

import transcribe

secrets = dotenv_values(".env")
apiKey = secrets["ASSEMBLYAI_API_KEY"]

app = Flask(__name__)

@app.route("/", methods=['GET'])
def index():
    return render_template("index.html")

@app.route("/test", methods=['GET'])
def test():
    return render_template("test.html")

@app.route("/upload", methods=["POST"])
def upload():
    data = request.get_json()
    if data is None:
        return jsonify({error: "::NOTHING::"}), 404
    # assemblyai expects binary data
    audio=base64.b64decode(data['recording'])
    url = transcribe.upload_file(data['apiKey'] or apiKey, audio)
    return transcribe.create_transcript(apiKey, url), 200
    
if __name__ == "__main__":
    app.run(
    debug=True
    )
