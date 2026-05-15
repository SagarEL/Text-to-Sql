import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, text
import google.generativeai as genai
import requests
import pandas as pd
import numpy as np
from dotenv import load_dotenv
from typing import List, Literal
import random

load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# LLM configurations
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
LOCAL_LLM_URL = os.getenv("LOCAL_LLM_URL", "http://localhost:1234")  # Default Ollama port

if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY is not set. Please add it to the .env file.")
else:
    genai.configure(api_key=GEMINI_API_KEY)


# Pydantic models
class DBCredentials(BaseModel):
    db_user: str
    db_password: str
    db_host: str
    db_port: str
    db_name: str


class QueryRequest(BaseModel):
    question: str
    db_credentials: DBCredentials
    llm_choice: Literal["gemini", "local"] = "gemini"


class DBStructureRequest(BaseModel):
    db_credentials: DBCredentials


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]
    db_credentials: DBCredentials
    llm_choice: Literal["gemini", "local"] = "gemini"


# LLM choice function
def choose_llm(llm_choice: str):
    if llm_choice == "gemini":
        return nl_to_sql_gemini
    elif llm_choice == "local":
        return nl_to_sql_local
    else:
        raise ValueError("Invalid LLM choice")


def nl_to_sql_gemini(question: str, table_info: str) -> str:
    prompt = f"""
    Given the following tables in a PostgreSQL database:

    {table_info}

    Convert the following natural language question to a SQL query:

    {question}

    IMPORTANT RULES:
    1. You can generate SELECT, UPDATE, INSERT, DELETE queries as needed
    2. Column data types are shown in parentheses - use appropriate values for each type:
       - For smallint/integer/bigint columns: use numeric values (0, 1, 2, etc.)
       - For text/character varying columns: use quoted strings ('value')
       - Boolean-like smallint columns (0/1) should use 0 or 1, NOT 'Yes'/'No'
    3. If a column has type 'text' or 'character varying' but contains date values, cast it to date using ::date before using date functions
       Example: EXTRACT(YEAR FROM "date_column"::date) instead of EXTRACT(YEAR FROM "date_column")
    4. If a column has type 'text' or 'character varying' but contains numeric values, cast it to numeric type before math operations
       Example: AVG("column"::numeric) or SUM("column"::integer) instead of AVG("column")
    5. If a column is already an integer type (like bigint, integer) and represents a year, DO NOT cast it to date
       Example: Use "JoiningYear" directly, NOT "JoiningYear"::date
    6. Always use double quotes for table and column names that contain spaces or special characters
    7. For UPDATE queries, make sure to include a WHERE clause to avoid updating all rows unless explicitly requested
    8. Return ONLY the SQL query without ``` markdown formatting, without the word 'sql', and without any explanation
    """

    model = genai.GenerativeModel(GEMINI_MODEL)
    response = model.generate_content(prompt)

    return response.text.strip()


# Local LLM function (using Ollama)
def nl_to_sql_local(question: str, table_info: str) -> str:
    prompt = f"""
    Given the following tables in a PostgreSQL database:

    {table_info}

    Convert the following natural language question to a SQL query:

    {question}

    IMPORTANT RULES:
    1. You can generate SELECT, UPDATE, INSERT, DELETE queries as needed
    2. Column data types are shown in parentheses - use appropriate values for each type:
       - For smallint/integer/bigint columns: use numeric values (0, 1, 2, etc.)
       - For text/character varying columns: use quoted strings ('value')
       - Boolean-like smallint columns (0/1) should use 0 or 1, NOT 'Yes'/'No'
    3. If a column has type 'text' or 'character varying' but contains date values, cast it to date using ::date before using date functions
       Example: EXTRACT(YEAR FROM "date_column"::date) instead of EXTRACT(YEAR FROM "date_column")
    4. If a column has type 'text' or 'character varying' but contains numeric values, cast it to numeric type before math operations
       Example: AVG("column"::numeric) or SUM("column"::integer) instead of AVG("column")
    5. If a column is already an integer type (like bigint, integer) and represents a year, DO NOT cast it to date
       Example: Use "JoiningYear" directly, NOT "JoiningYear"::date
    6. Always use double quotes for table and column names that contain spaces or special characters
    7. For UPDATE queries, make sure to include a WHERE clause to avoid updating all rows unless explicitly requested
    8. Return ONLY the SQL query without ``` markdown formatting, without the word 'sql', and without any explanation
    """

    response = requests.post(
        f"{LOCAL_LLM_URL}/v1/chat/completions",
        json={
            "model": "defog/sqlcoder-7b-2/sqlcoder-7b-q5_k_m.gguf",
            "messages": [
                {
                    "role": "system",
                    "content": prompt
                }
            ],
            "stream": False
        }
    )
    response = response.json()
    print(response['choices'][0]['message']['content'])

    if response:
        return response['choices'][0]['message']['content'].strip()
    else:
        raise HTTPException(status_code=500, detail="Error in local LLM request")


def get_db_structure(db_credentials: DBCredentials):
    db_url = f"postgresql://{db_credentials.db_user}:{db_credentials.db_password}@{db_credentials.db_host}:{db_credentials.db_port}/{db_credentials.db_name}"
    engine = create_engine(db_url)
    with engine.connect() as connection:
        result = connection.execute(
            text("SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, ordinal_position;"))
        table_info = pd.DataFrame(result.fetchall(), columns=result.keys())

    structured_data = {}
    for table in table_info['table_name'].unique():
        table_data = table_info[table_info['table_name'] == table]
        structured_data[table] = [
            f"{row['column_name']} ({row['data_type']})"
            for _, row in table_data.iterrows()
        ]

    return structured_data


def analyze_visualization_needs(df: pd.DataFrame) -> dict:
    """
    Intelligently determine if and what type of visualization is suitable for the data.
    Returns visualization config or None if visualization is not appropriate.
    """
    if df.empty or len(df) < 2:
        return None

    columns = df.columns.tolist()
    numeric_cols = df.select_dtypes(include=['int64', 'float64', 'int32', 'float32']).columns.tolist()
    categorical_cols = df.select_dtypes(include=['object', 'string']).columns.tolist()

    if len(df) > 1000:
        return None

    if len(columns) > 10:
        return None

    if len(columns) == 2 and len(categorical_cols) == 1 and len(numeric_cols) == 1:
        unique_categories = df[categorical_cols[0]].nunique()
        if 2 <= unique_categories <= 50:
            return {
                "type": "bar",
                "xAxis": categorical_cols[0],
                "yAxis": numeric_cols[0],
                "title": f"{numeric_cols[0]} by {categorical_cols[0]}"
            }

    if len(numeric_cols) >= 2:
        first_col = numeric_cols[0]
        is_sequential = df[first_col].is_monotonic_increasing or df[first_col].is_monotonic_decreasing

        if is_sequential and len(df) >= 3:
            return {
                "type": "line",
                "xAxis": numeric_cols[0],
                "yAxis": numeric_cols[1],
                "title": f"{numeric_cols[1]} over {numeric_cols[0]}"
            }
        elif len(df) <= 100:
            return {
                "type": "scatter",
                "xAxis": numeric_cols[0],
                "yAxis": numeric_cols[1],
                "title": f"{numeric_cols[1]} vs {numeric_cols[0]}"
            }

    if len(categorical_cols) == 1 and len(numeric_cols) >= 2:
        unique_categories = df[categorical_cols[0]].nunique()
        if 2 <= unique_categories <= 20 and len(numeric_cols) <= 5:
            return {
                "type": "grouped_bar",
                "xAxis": categorical_cols[0],
                "yAxes": numeric_cols,
                "title": f"Comparison across {categorical_cols[0]}"
            }

    if len(columns) == 2 and len(categorical_cols) == 1 and len(numeric_cols) == 1:
        unique_categories = df[categorical_cols[0]].nunique()
        if 2 <= unique_categories <= 8:
            total = df[numeric_cols[0]].sum()
            if total > 0:
                return {
                    "type": "pie",
                    "dataKey": numeric_cols[0],
                    "nameKey": categorical_cols[0],
                    "title": f"Distribution of {numeric_cols[0]}"
                }

    date_cols = []
    for col in categorical_cols:
        try:
            sample = df[col].dropna().iloc[0] if len(df[col].dropna()) > 0 else None
            if sample and (isinstance(sample, str) and any(char in sample for char in ['-', '/', ':'])):
                pd.to_datetime(df[col].head(), errors='raise')
                date_cols.append(col)
        except:
            pass

    if date_cols and len(numeric_cols) >= 1:
        return {
            "type": "line",
            "xAxis": date_cols[0],
            "yAxis": numeric_cols[0],
            "title": f"{numeric_cols[0]} over time"
        }

    return None


def execute_sql_query(query: str, db_credentials: DBCredentials):
    db_url = f"postgresql://{db_credentials.db_user}:{db_credentials.db_password}@{db_credentials.db_host}:{db_credentials.db_port}/{db_credentials.db_name}"
    engine = create_engine(db_url)

    statements = [stmt.strip() for stmt in query.split(';') if stmt.strip()]

    with engine.connect() as connection:
        result = None
        affected_rows_total = 0

        for i, stmt in enumerate(statements):
            stmt_upper = stmt.upper()
            is_modification = any(stmt_upper.startswith(keyword) for keyword in
                                 ['UPDATE', 'INSERT', 'DELETE', 'ALTER', 'CREATE', 'DROP', 'TRUNCATE'])

            result = connection.execute(text(stmt))

            if is_modification:
                connection.commit()
                affected_rows_total += result.rowcount
                print(f"Executed modification query {i+1}/{len(statements)}: {result.rowcount} row(s) affected")

        last_stmt_upper = statements[-1].upper()
        if last_stmt_upper.startswith('SELECT'):
            df = pd.DataFrame(result.fetchall(), columns=result.keys())

            df = df.replace([np.inf, -np.inf], None)
            df = df.replace({np.nan: None})

            records = df.to_dict(orient="records")
            records = [row for row in records if row is not None]

            viz_config = analyze_visualization_needs(df)
            print(f"DataFrame shape: {df.shape}, columns: {df.columns.tolist()}")
            print(f"Visualization config: {viz_config}")
            return records, viz_config
        else:
            return [{
                "status": "success",
                "message": f"Query executed successfully. {affected_rows_total} row(s) affected.",
                "affected_rows": affected_rows_total
            }], None


def format_response_with_llm(sql_query: str, query_results: str, llm_choice: str) -> str:
    prompt = f"""
    Analyze the following query results and provide insights:

    Results: {query_results}

    Please provide a clear and concise analysis of the data. Focus on key trends, patterns, or notable information in the results. Use markdown formatting to structure your response, including:

    - Headers for main sections
    - Bullet points or numbered lists for key points
    - Bold or italic text for emphasis
    - Code blocks for any numerical data or examples

    Your analysis should be informative and easy to understand for someone looking at this data.
    """

    if llm_choice == "gemini":
        formatted_response = format_response_gemini(prompt)
    elif llm_choice == "local":
        formatted_response = format_response_local(prompt)
    else:
        raise ValueError("Invalid LLM choice")

    formatted_response += f"\n\n[SQL_QUERY]{sql_query}[/SQL_QUERY]"

    return formatted_response


def format_response_gemini(prompt: str) -> str:
    model = genai.GenerativeModel(GEMINI_MODEL)
    response = model.generate_content(prompt)
    return response.text.strip()


def format_response_local(prompt: str) -> str:
    response = requests.post(
        f"{LOCAL_LLM_URL}/v1/chat/completions",
        json={
            "model": "defog/sqlcoder-7b-2/sqlcoder-7b-q5_k_m.gguf",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a data analyst providing insights on query results. Use markdown formatting in your responses."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "stream": False
        }
    )
    response_json = response.json()
    return response_json['choices'][0]['message']['content'].strip()


@app.post("/query")
async def query(request: QueryRequest):
    try:
        db_structure = get_db_structure(request.db_credentials)
        table_info_str = "\n".join(
            [f"Table: {table}, Columns: {', '.join(columns)}" for table, columns in db_structure.items()])

        nl_to_sql_func = choose_llm(request.llm_choice)

        sql_query = nl_to_sql_func(request.question, table_info_str)
        print(sql_query)

        results, viz_config = execute_sql_query(sql_query, request.db_credentials)

        response = {
            "question": request.question,
            "sql_query": sql_query,
            "results": results
        }

        if viz_config:
            response["visualization"] = viz_config

        return response
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        db_structure = get_db_structure(request.db_credentials)

        system_message = f"""You are a helpful AI assistant that can query a PostgreSQL database.
        When generating SQL queries, do not include ``` or 'sql' tags. Do not even include any kind of comments, give just the queries. Only return the raw SQL query.
        Here's the database schema: {db_structure}
        """

        messages = [{"role": "system", "content": system_message}] + [m.dict() for m in request.messages]

        if request.llm_choice == "gemini":
            model = genai.GenerativeModel(GEMINI_MODEL)
            response = model.generate_content(
                [messages[i]['content'] for i in range(len(messages))])
            ai_message = response.text.strip()
        elif request.llm_choice == "local":
            response = requests.post(
                f"{LOCAL_LLM_URL}/v1/chat/completions",
                json={
                    "model": "defog/sqlcoder-7b-2/sqlcoder-7b-q5_k_m.gguf",
                    "messages": messages,
                    "stream": False
                }
            )
            response = response.json()

            if response:
                ai_message = response['choices'][0]['message']['content'].strip()
            else:
                raise HTTPException(status_code=500, detail="Error in local LLM request")
        else:
            raise ValueError("Invalid LLM choice")

        if "SELECT" in ai_message.upper():
            try:
                results, viz_config = execute_sql_query(ai_message, request.db_credentials)
                formatted_response = format_response_with_llm(ai_message, str(results), request.llm_choice)

                response_data = {
                    "role": "assistant",
                    "content": formatted_response,
                    "tabular_data": results
                }

                if viz_config:
                    response_data["visualization"] = viz_config

                return response_data
            except Exception as e:
                error_message = f"Error executing query: {str(e)}"
                formatted_response = format_response_with_llm(ai_message, error_message, request.llm_choice)
                return {"role": "assistant", "content": formatted_response}
        else:
            return {"role": "assistant", "content": ai_message}

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/db-structure")
async def get_db_structure_endpoint(request: DBStructureRequest):
    try:
        structure = get_db_structure(request.db_credentials)
        return {"structure": structure}
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))


class HealthData(BaseModel):
    average_heart_rate: float
    average_temperature: float
    average_ecg: float
    average_spo2: float


def get_average_sensor_data(user_id: int, days: int = 800):
    return HealthData(
        average_heart_rate=random.randint(60, 100),
        average_temperature=random.randint(96, 100),
        average_ecg=random.randint(60, 100),
        average_spo2=random.randint(90, 100)
    )


@app.get("/api/health_data/{user_id}")
async def health_data_api(user_id: int):
    data = get_average_sensor_data(user_id)
    if data is None:
        print(f"No data found for user {user_id}")
        raise HTTPException(status_code=404, detail="No data found for this user")
    return data


@app.get("/")
async def root():
    return {"status": "ok", "message": "N2SQL API is running. LLM: Gemini only."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
