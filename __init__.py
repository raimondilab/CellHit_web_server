from flask import Flask, render_template, request, redirect, url_for
import os, glob
import sys
import pandas as pd


# Create app
app = Flask(__name__)

path = os.getcwd()
path = app.root_path


# Homepage
@app.route('/')
@app.route('/index/')
def index():
    return render_template("index.html")

# Result
@app.route('/result/')
def result():
    return render_template("result.html")


if __name__ == "__main__":
    app.run(debug=True, port=5000)
