import os
import google.generativeai as genai
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# 1. تحميل المفتاح السري 
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("تأكد من وضع مفتاح GEMINI_API_KEY في ملف .env")

genai.configure(api_key=api_key)

# 2. إعداد "دستور مِسبار"
system_instruction = """
أنت 'مِسبار'، مساعد استراتيجي صارم ومحترف.
- إذا قام المستخدم بإعطائك نصاً طويلاً، أو جدولاً دراسياً، أو خطة عمل، قم بتحليل النص واستخراج المهام.
- أعد النتيجة حصرياً بصيغة JSON صحيحة.
- يجب أن يكون الـ JSON عبارة عن مصفوفة اسمها "tasks"، وكل مهمة تحتوي على: 
  "title" (اسم المهمة)، "date" (تاريخ المهمة بصيغة YYYY-MM-DD)، و "priority" (عالية، متوسطة، منخفضة).
- لا تضف أي نصوص أخرى.
"""

model = genai.GenerativeModel(
    model_name="gemini-1.5-pro",
    system_instruction=system_instruction
)

# 3. تشغيل سيرفر Flask
app = Flask(__name__)
CORS(app) 

@app.route('/api/chat', methods=['POST'])
def chat_with_misbar():
    data = request.json
    user_message = data.get("message", "")
    
    if not user_message:
        return jsonify({"error": "الرسالة فارغة"}), 400

    try:
        response = model.generate_content(user_message)
        return jsonify({"response": response.text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("🚀 سيرفر 'مِسبار' يعمل الآن بسلام...")
    app.run(debug=True, port=5000)
    