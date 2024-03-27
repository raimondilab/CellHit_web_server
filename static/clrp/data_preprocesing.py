import os
import sys
import mysql.connector
import pandas as pd
import pymysql
from mysql.connector import errorcode


# Getting data from result file
def read_data(filename):
    columns = ['drug_name', 'drug_id', 'source', 'sample_index', 'predictions', 'predictions_std', 'quantile_score',
               'experimental_min', 'experimental_median', 'experimental_max', 'model_mse', 'model_corr',
               'transcr_ccle_neigh', 'transcr_ccle_neigh_celllinename', 'transcr_ccle_neigh_oncotree',
               'response_ccle_neigh', 'response_ccle_neigh_celllinename', 'response_ccle_neigh_oncotree',
               'transcr_tcga_neigh', 'transcr_tcga_neigh_diagnosis', 'transcr_tcga_neigh_site', 'response_tcga_neigh',
               'response_tcga_neigh_diagnosis', 'response_tcga_neigh_site', 'putative_target', 'top_local_shap_genes',
               'recovered_target']
    df = pd.read_csv(filename, header=None, names=columns, low_memory=False, sep=",")
    df = df.iloc[1:,:]
    df = df.fillna(" ")
    return df


# Inserting Pandas DataFrames Into Databases Using INSERT
def dataframe_to_mysql(data_file, table):
    # Connect to the database
    connection = pymysql.connect(host='localhost',
                                 user='bionfolab',
                                 password='Bioinfolab22#@!',
                                 db='cellhit')
    # create cursor
    cursor = connection.cursor()

    # creating column list for insertion
    cols = "`,`".join([str(i) for i in data_file.columns.tolist()])

    # Insert DataFrame records one by one.
    for i, row in data_file.iterrows():
        print(row)
        sql = f"INSERT INTO {table} (`" + cols + "`) VALUES (" + "%s," * (len(row) - 1) + "%s)"
        cursor.execute(sql, tuple(row))
        connection.commit()


# Manage MySQL error
def mysql_err(err):
    if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
        print("Something is wrong with your user name or password")
    elif err.errno == errorcode.ER_BAD_DB_ERROR:
        print("Database does not exist")
    else:
        print(err)


if __name__ == "__main__":
    dataframe_to_mysql(read_data("full_results_gdsc.csv"), "gdsc")
