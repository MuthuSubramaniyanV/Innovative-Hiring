import google.generativeai as genai

genai.configure(api_key="AIzaSyBOq7h29whug3VVqn5hXaStTDLGTPdYoc4")

models = genai.list_models()
for model in models:
    print(model.name)
