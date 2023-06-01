import os
import sys
import pandas as pd

# Getting path
path = os.getcwd()
sys.path.insert(1, path + '/static/clrp')


# Getting data from result file
def read_data(filename):
    df = pd.read_csv(filename, header=0, low_memory=False, sep=",")
    return df


