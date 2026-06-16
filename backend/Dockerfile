FROM python:3.13-slim

WORKDIR /app

# 复制所有文件
COPY . .

# 安装依赖
RUN pip install --no-cache-dir .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
