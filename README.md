## 后端运行方式

前端不启动后端也能展示。需要完整接口时：

```bash
cd backend
pip install -r requirements.txt
python seed_demo_data.py
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```


## 后端启动

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# macOS / Linux:
source venv/bin/activate
pip install -r requirements.txt
python seed_demo_data.py
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

启动后访问：

- API 根路径：`http://127.0.0.1:8000/`
- Swagger 文档：`http://127.0.0.1:8000/docs`
