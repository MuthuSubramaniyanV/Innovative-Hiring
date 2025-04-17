import google.generativeai as genai
genai.configure(api_key="AIzaSyADcR9fBTk3ifsmQgPaXKidTQUqMI3YoK0")
model = genai.GenerativeModel("tunedModels/mcq-tuned-data-xsqk5r81s39p")
response = model.generate_content("generate  10 multiple choice questions on the topic of Python programming")
print(response.text)
