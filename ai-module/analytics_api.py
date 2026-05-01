from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import os
from dotenv import load_dotenv
from placement_readiness import calculate_score, analyze_skill_gap

load_dotenv()

app = Flask(__name__)
CORS(app)

client = MongoClient(os.getenv('MONGO_URI', 'mongodb://localhost:27017/academic_placement_db'))
db     = client['academic_placement_db']

@app.route('/health')
def health():
    return jsonify({'status': 'ok', 'service': 'AcadPlace AI Module'})

@app.route('/score/<enrollment>', methods=['GET'])
def get_score(enrollment):
    student = db.students.find_one({'enrollmentNumber': enrollment.upper()}, {'_id': 0})
    if not student:
        return jsonify({'error': 'Student not found'}), 404
    score  = calculate_score(student)
    gaps   = analyze_skill_gap(student)
    return jsonify({'enrollmentNumber': enrollment, 'score': score, 'skillGaps': gaps})

@app.route('/recalculate-all', methods=['POST'])
def recalculate_all():
    students = list(db.students.find({'isActive': True}))
    updated  = 0
    for s in students:
        score = calculate_score(s)
        gaps  = analyze_skill_gap(s)
        db.students.update_one(
            {'_id': s['_id']},
            {'$set': {'placementReadinessScore': score, 'skillGaps': gaps, 'suggestedSkills': gaps[:3]}}
        )
        updated += 1
    return jsonify({'message': f'Updated {updated} students'})

@app.route('/analytics/department', methods=['GET'])
def department_analytics():
    students = list(db.students.find({'isActive': True}))
    if not students:
        return jsonify({'avgScore': 0, 'avgCGPA': 0, 'totalStudents': 0})

    scores = [s.get('placementReadinessScore', 0) for s in students]
    cgpas  = [s.get('cgpa', 0) for s in students]

    return jsonify({
        'totalStudents': len(students),
        'avgScore':      round(sum(scores) / len(scores), 2),
        'avgCGPA':       round(sum(cgpas)  / len(cgpas),  2),
        'highReadiness': sum(1 for s in scores if s >= 70),
        'placed':        sum(1 for s in students if s.get('placementStatus') == 'placed')
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)