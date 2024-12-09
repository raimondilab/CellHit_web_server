import pickle
import pandas as pd
import json

class tcgaCodeMap:
    """Class to map TCGA codes to integers and vice versa
    
    Args:
        tcga_metadata_path: Path to TCGA metadata
        tcga_data_path: Path to TCGA data
        tcga_project_ids_path: Path to TCGA project ids
    """
    def __init__(self, tcga_metadata_path: str, tcga_data_path: str, tcga_project_ids_path: str):
        self.tcga_metadata = pd.read_csv(tcga_metadata_path)
        self.tcga_metadata_mapper = dict(zip(self.tcga_metadata['sample_id'], self.tcga_metadata['tcga_cancer_acronym']))

        #load project ids
        with open(tcga_project_ids_path, 'r') as f:
            self.project_ids = json.load(f)

        #tcga data
        self.tcga = pd.read_feather(tcga_data_path).set_index('index')
        self.tcga['tcga_cancer_acronym'] = self.tcga.index.map(self.tcga_metadata_mapper)
        self.tcga_covariates = self.tcga.pop('tcga_cancer_acronym')

        self.tcga_covariates = pd.DataFrame(self.tcga_covariates, columns=['tcga_cancer_acronym'])
        self.tcga_covariates['tcga_cancer_acronym'] = pd.Categorical(self.tcga_covariates['tcga_cancer_acronym'],
                                                                     categories=self.project_ids,
                                                                     ordered=False)
        self.tcga_covariates['tcga_cancer_acronym_codes'] = self.tcga_covariates['tcga_cancer_acronym'].cat.codes

        self.correction_code_mapper = dict(zip(self.tcga_covariates['tcga_cancer_acronym_codes'], self.tcga_covariates['tcga_cancer_acronym']))
        self.reverse_correction_code_mapper = {v: k for k, v in self.correction_code_mapper.items()}

    def lookup_tcga_code(self, code: str) -> int:
        return self.reverse_correction_code_mapper[code]

    def lookup_integer_code(self, code: int) -> str:
        return self.correction_code_mapper[code]

    def save(self, path: str):
        with open(path, 'wb') as f:
            pickle.dump(self, f)

    @classmethod
    def load(cls, path: str):
        with open(path, 'rb') as f:
            return pickle.load(f)
        

    def save_json(self, path: str) -> None:
        """Save class data as JSON.
        
        Args:
            path: Path to save the JSON file
        """
        data = {
            'tcga_metadata_mapper': self.tcga_metadata_mapper,
            'project_ids': self.project_ids,
            'correction_code_mapper': self.correction_code_mapper,
            'reverse_correction_code_mapper': self.reverse_correction_code_mapper
        }
        with open(path, 'w') as f:
            json.dump(data, f)

    #@classmethod
    @classmethod
    def load_json(cls, path: str) -> 'CodeMapper':
        """Load class from JSON.
        
        Args:
            path: Path to the JSON file
            
        Returns:
            CodeMapper: New instance loaded from JSON
        """
        with open(path, 'r') as f:
            data = json.load(f)
            
        instance = cls.__new__(cls)
        instance.tcga_metadata_mapper = data['tcga_metadata_mapper'] 
        instance.project_ids = data['project_ids']
        instance.correction_code_mapper = data['correction_code_mapper']
        instance.reverse_correction_code_mapper = data['reverse_correction_code_mapper']
        return instance
        