import pandas as pd
import io
import json
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from ..models.sample_question import SampleQuestion

class SampleProcessor:
    # Define aliases for fluid import
    ALIASES = {
        'question_text': ['question_text', 'question', 'question text', 'q', 'qt', 'desc', 'description', 'content', 'statement', 'problem'],
        'question_type': ['question_type', 'type', 'qtype', 'kind', 'format', 'category'],
        'marks': ['marks', 'mark', 'score', 'points', 'max_marks', 'm'],
        'difficulty': ['difficulty', 'diff', 'level', 'complexity', 'bloom'],
        'topic': ['topic', 'chapter', 'module', 'unit name', 't'],
        'unit': ['unit', 'unit_no', 'unit number', 'u'],
        'co_mapping': ['co_mapping', 'co', 'course outcome', 'cos'],
        'lo_mapping': ['lo_mapping', 'lo', 'learning outcome', 'los']
    }

    def _find_column(self, df: pd.DataFrame, field_aliases: List[str]) -> str:
        """Helper to find column by aliases (case-insensitive)"""
        # Create map of lower-stripped header -> actual header
        header_map = {str(h).lower().strip(): h for h in df.columns}
        
        for alias in field_aliases:
            if alias.lower() in header_map:
                return header_map[alias.lower()]
        return None

    def process_file(self, db: Session, subject_id: int, file_content: bytes, filename: str, topic_id: int = None) -> Dict[str, Any]:
        """
        Parse CSV or Excel content with fluid column mapping.
        """
        try:
            # Read file into DataFrame
            try:
                if filename.endswith('.csv'):
                    df = pd.read_csv(io.BytesIO(file_content))
                else:
                    df = pd.read_excel(io.BytesIO(file_content))
            except ImportError as e:
                if "openpyxl" in str(e) or "optional dependency" in str(e):
                    raise ValueError("Excel processing requires 'openpyxl'. Please run: pip install openpyxl")
                raise e
            
            # Fill NaN values with empty string
            df = df.fillna('')
            
            # Map columns using aliases
            col_map = {}
            for field, aliases in self.ALIASES.items():
                found_col = self._find_column(df, aliases)
                if found_col:
                    col_map[field] = found_col
            
            added_count = 0
            errors = []
            
            valid_questions = []

            for index, row in df.iterrows():
                try:
                    # Helper to get value from mapped column safely
                    def get_val(field, default=''):
                        if field in col_map:
                            return row[col_map[field]]
                        return default

                    # 1. Parse Mappings
                    co_map = self._parse_mapping(str(get_val('co_mapping')), is_numeric=False)
                    lo_map = self._parse_mapping(str(get_val('lo_mapping')), is_numeric=True)
                    
                    # 2. Parse Other Fields
                    q_text = str(get_val('question_text')).strip()
                    if not q_text:
                         # Default if completely missing
                         q_text = "Unknown Question"
                         
                    q_type = str(get_val('question_type', 'mcq')).strip().lower() or 'mcq'
                    
                    try:
                        marks_val = get_val('marks', 0)
                        marks = int(float(marks_val)) if marks_val else 0
                    except:
                        marks = 0
                        
                    difficulty = str(get_val('difficulty', 'medium')).strip().lower() or 'medium'
                    
                    topic = str(get_val('topic', 'General')).strip() or 'General'
                    
                    unit_val = None
                    try:
                        u_val = get_val('unit')
                        if u_val:
                            unit_val = int(float(u_val))
                    except:
                        unit_val = None

                    # Create Model
                    sample = SampleQuestion(
                        subject_id=subject_id,
                        question_text=q_text,
                        question_type=q_type,
                        marks=marks,
                        difficulty=difficulty,
                        co_mapping=co_map,
                        lo_mapping=lo_map,
                        topic=topic,
                        unit=unit_val,
                        topic_id=topic_id 
                    )
                    
                    db.add(sample)
                    added_count += 1
                    
                    # Add to valid list for return
                    valid_questions.append({
                        "question_text": q_text,
                        "type": q_type,
                        "difficulty": difficulty,
                        "marks": marks,
                        "co": co_map,
                        "lo": lo_map
                    })
                    
                except Exception as e:
                    errors.append(f"Row {index+2}: {str(e)}")
                    
            if added_count > 0:
                db.commit()
                
            return {
                "status": "partial_success" if errors else "success",
                "added": added_count,
                "errors": errors,
                "questions": valid_questions
            }
            
        except ValueError as ve:
            raise ve
        except Exception as e:
            raise ValueError(f"Processing failed: {str(e)}")

    def _parse_mapping(self, mapping_str: str, is_numeric: bool = False) -> Dict:
        """
        Parses string like "Key:Value,Key2:Value2" into a dictionary.
        """
        if not mapping_str or not mapping_str.strip():
            return {}
            
        result = {}
        # Split by comma (handling potential spaces)
        items = [item.strip() for item in mapping_str.split(',') if item.strip()]
        
        for item in items:
            if ':' not in item:
                continue
                
            key, val = item.split(':', 1)
            key = key.strip()
            val = val.strip()
            
            if is_numeric:
                try:
                    result[key] = float(val)
                except ValueError:
                    result[key] = 0.0 # Default fallback
            else:
                result[key] = val
                
        return result

sample_processor = SampleProcessor()
