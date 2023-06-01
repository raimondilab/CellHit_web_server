from flask import Flask, render_template, request, redirect, url_for, jsonify
import os
import sys
import pandas as pd
from werkzeug.utils import secure_filename
import tempfile
import json

# Create app
app = Flask(__name__)

# Set path
path = os.getcwd()
path = app.root_path

# Set of allowed file extensions
ALLOWED_EXTENSIONS = {'csv'}

# Folders where we will store the uploaded files
UPLOAD_DATA_FOLDER = path + '/static/tmp/'

# Define the path to the upload folder
app.config['UPLOAD_FOLDER'] = UPLOAD_DATA_FOLDER


# Homepage
@app.route('/')
@app.route('/index/')
def index():
    return render_template("index.html")


# Upload user data
@app.route('/result/', methods=['GET', 'POST'])
def result():
    temp_name, temp_name_annotation = "", ""
    lineages = []

    if request.method == 'POST':
        # file = request.files.getlist("dataset")[0]
        # annotation_file = request.files.getlist('annotation')[0]
        #
        # if file and allowed_file(file.filename):
        #     filename = secure_filename(file.filename)
        #     temp_file = tempfile.NamedTemporaryFile(prefix=filename, suffix=".csv", delete=False)
        #     temp_name = temp_file.name.split(os.sep)[-1]
        #     file.save(os.path.join(app.config['UPLOAD_FOLDER'], temp_name))
        #
        # if annotation_file and allowed_file(annotation_file.filename):
        #     filename = secure_filename(annotation_file.filename)
        #     temp_file = tempfile.NamedTemporaryFile(prefix=filename, suffix=".csv", delete=False)
        #     temp_name_annotation = temp_file.name.split(os.sep)[-1]
        #     annotation_file.save(os.path.join(app.config['UPLOAD_FOLDER'], temp_name_annotation))

        df = pd.read_csv("static/clrp/map_lineage.csv")
        lineages = list(df['lineage'].unique())

    return render_template("result.html", lineages=lineages)


@app.route('/subtypes', methods=['GET', 'POST'])
def get_subtype_list():
    subtypes = []

    if request.method == 'POST':
        target = request.get_json(force=True)
        target = target.get('lineage')
        target = str(target.strip())

        df = pd.read_csv("static/clrp/map_lineage.csv")
        df = df[df['lineage'] == target]
        subtypes = list(df['subtype'].unique())

    return json.dumps(subtypes)


# Check allowed file extensions
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


if __name__ == "__main__":
    app.run(debug=True, port=5000)
