# 서비스 코드 및 배포 방법



## 0. Pre-requisites

이 코드 샘플은 Amazon Bedrock의 Anthropic Claude 모델을 활용합니다. 모델 액세스를 참조하여 모델 액세스를 활성화하세요. 더 작은 스키마의 경우 Claude 3 Haiku를 사용하고, 더 큰 복잡한 스키마의 경우 Claude 3 Sonnet를 사용하는 것이 좋습니다. Claude 3 Haiku는 추론 지연 시간을 개선하고 비용을 최소화할 수 있지만, Claude 3 Sonnet는 추론 능력이 더 뛰어납니다.aiku will improve inference latency and minimize cost, but Claude 3 Sonnet has better reasoning capabilities.

## 1. Environment setup

참고: AWS Cloud9 또는 Amazon SageMaker Studio JupyterLab(권장)을 사용하는 경우 1.2 단계로 건너뛸 수 있습니다.

다음은 python3 설치가 필요합니다.


```bash
python3 -m venv .venv
```

init 프로세스가 완료되고 가상 환경이 생성되면 다음 단계를 사용하여 가상 환경을 활성화할 수 있습니다.

```bash
source .venv/bin/activate
```

AWS 환경에 대한 액세스 권한이 필요합니다. 환경 변수 설정 방법을 참조하세요.

루트 디렉토리에 .env 파일을 만들고 다음 값을 추가하세요.

```text
AWS_REGION="YourRegion" #example us-east-1
AWS_PROFILE="myprofile" #from ~/.aws/config
```

### 1.2 Install the required packages

필요한 패키지를 설치하려면 다음 명령을 실행하세요:

```bash
pip install -r requirements.txt
```

## 2. Creating the simulated MES

이 리포지토리에는 기본 제조 실행 시스템(MES)을 시뮬레이션하는 스크립트가 포함되어 있습니다. 이 시스템은 원자재에서 완제품까지 생산 프로세스를 관리하고 모니터링합니다. 

데이터베이스 구조는 제품, 기계, 작업 주문, 재고 수준, 품질 관리 및 직원 세부 정보를 추적하도록 설계되었습니다.

데이터베이스 테이블을 생성하고 합성 데이터로 채우려면 프로젝트 루트 디렉토리에서 다음을 실행하세요:

```bash
# create tables and simulation data
python3 MES-synthetic-data/sqlite-synthetic-mes-data.py
```

> 참고: 스크립트를 쉽게 업데이트하여 더 많은 합성 데이터를 생성할 수 있습니다. 각 테이블에는 필요에 따라 수정할 수 있는 간단한 함수가 제공됩니다.

<!-- ### Validate that the tables were successfully created

After executing the `sqlite-synthetic-mes-data.py` script, which creates the SQLite database file `mes.db` and populates it with synthetic data, you can test and verify the database using the following steps:

1. **Open the SQLite Command-line Tool**:

    Open a terminal or command prompt, navigate to the `MES-synthetic-data` directory, and run the following command:

    ```bash
    sqlite3 mes.db
    ```

    This will open the SQLite command-line tool and connect to the `mes.db` database file.

2. **List the Tables**:

    Inside the SQLite command-line tool, list all the tables in the database by running:

    ```sql
    .tables
    ```

    You should see the following tables listed: `Products`, `Machines`, `WorkOrders`, `Inventory`, `QualityControl`, and `Employees`.

3. **Query a Table**:

    To check the content of a specific table, execute a `SELECT` query. For example, to retrieve the first 10 rows from the `Products` table:

    ```sql
    SELECT * FROM Products LIMIT 10;
    ```

    ![table list](assets/table-list.png)
4. **Execute Custom Queries**:

    You can run any other SQL queries to inspect the data in the other tables. For example:

    ```sql
    SELECT * FROM Machines LIMIT 5;
    SELECT COUNT(*) FROM WorkOrders;
    SELECT Name, Role FROM Employees WHERE Shift = 'morning';
    ```

5. **Exit the SQLite Command-line Tool**:

    When you're done inspecting the data, exit the SQLite command-line tool by typing `.quit` or pressing `Ctrl+D`.

This concludes the pre-requisites section and the system is now ready. An overview of the simulated MES is provided below.

### Table Overview

To better understand the data we are working with, here's an overview of each table and its role within the system:

#### Products Table

- **Purpose**: Stores information about the products being manufactured.
- **Columns**:
  - `ProductID`: A unique identifier for each product, automatically generated.
  - `Name`: The name of the product, which is a required field.
  - `Description`: A text description of the product, which is optional.

#### Machines Table

- **Purpose**: Contains details about the machinery used in the manufacturing process.
- **Columns**:
  - `MachineID`: The unique identifier for each machine, automatically generated.
  - `Name`: The name of the machine.
  - `Type`: The type or category of the machine.
  - `Status`: The current status of the machine, restricted to 'running', 'idle', or 'maintenance' through a check constraint.

#### Work Orders Table

- **Purpose**: Tracks production work orders.
- **Columns**:
  - `OrderID`: A unique identifier for each work order, automatically generated.
  - `ProductID`: A reference to the `ProductID` in the Products table.
  - `Quantity`: The number of units to be produced, must be greater than 0.
  - `StartDate`: The start date of the work order.
  - `EndDate`: The expected end date of the work order.
  - `Status`: The current status of the work order.

#### Inventory Table

- **Purpose**: Manages inventory items, including materials or components.
- **Columns**:
  - `ItemID`: A unique identifier for each inventory item, automatically generated.
  - `Name`: The name of the inventory item.
  - `Quantity`: The current quantity in stock, must be non-negative.
  - `ReorderLevel`: The quantity at which more of the item should be ordered, also must be non-negative.

#### Quality Control Table

- **Purpose**: Records the outcomes of quality control checks for work orders.
- **Columns**:
  - `CheckID`: A unique identifier for each quality control check, automatically generated.
  - `OrderID`: A reference to the `OrderID` in the Work Orders table.
  - `Date`: The date when the quality control check was performed.
  - `Result`: The result of the quality control check.
  - `Comments`: Optional comments about the check.

#### Employees Table

- **Purpose**: Stores details about employees involved in the manufacturing process.
- **Columns**:
  - `EmployeeID`: A unique identifier for each employee, automatically generated.
  - `Name`: The name of the employee.
  - `Role`: The role or job title of the employee.
  - `Shift`: The work shift of the employee.

This database structure is designed to facilitate the coordination and optimization of the production process, tracking key components of a manufacturing execution system.

## 3. Chatbot Interface

> Disclaimer: The chatbot is designed to operate with this demo database. If using against a real system, make sure that the user connecting the database has read-only access and to implement guardrails that would ensure the database would not get overloaded and apply SQL injection protections.

A demo streamlit application has been built to demonstrate how one can interact with an MES system using a natural language interface by asking questions about the data.

It implements in-memory storage for conversation history and is designed to generate SQL Queries and execute them against the simulated MES. It will automatically retrieve the database metadata (tables, column names, data types, sample data) to allow it to generate accurate queries. If an error is returned during the query, it will attempt to re-write the query based on the error returned. Finally, once it has retrieved the data from the system, it will use this information to answer the original user question.

Since this is built for demo purposes, it also shows intermediary steps in the console and will display the query generated in the chat interface. Processing time is also provided to the user: the time to generate the SQL query and the time to generate the response from the data returned by the query and the original question.

You can use the **reset button** to clear the chat history and ask a new question.

Some sample questions are provided. As this is a demo, the application has been set to show what happens in a more verbose way, so it will also show the specific SQL queries generated, how long it took to execute, and the result set returned from the MES to answer the question.

To start the streamlit app, simply run:

```bash
streamlit run chatbot/Chat.py 
```

> If running this example in AWS Cloud9, append `--server.port 8080` so you can access the streamlit app by clicking `Preview -> Preview Running Application` from the menu at the top of the screen. This way, you can access it securely without exposing any ports to the internet.

> If running this example in Amazon SageMaker Studio JupyterLab, you can access the streamlit app through the proxy on `https://{domainId}.studio.{region}.sagemaker.aws/jupyter/default/proxy/{port}/`, e.g. `https://d-abcd12345xyz.studio.us-east-1.sagemaker.aws/jupyter/default/proxy/8501/`. Make sure to include the trailing forward slash.

On the sidebar (left-hand side), you can reset the chat to clear the chat history and ask a new question. You can use one of the example questions provided or ask your own in the chat box at the bottom.

![chatbot](assets/chatwithMES.gif)

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file. -->