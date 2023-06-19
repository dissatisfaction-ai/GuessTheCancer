from flask import Flask, render_template, request, jsonify, session
import os
import random

app = Flask(__name__)
app.config['SECRET_KEY'] = 'supersecretkey'

# CANCER_TYPES = ['TCGA-COAD', 'TCGA-BRCA', 'TCGA-LUAD', 'TCGA-OV', 'TCGA-SKCM', 'TCGA-PRAD']

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/start', methods=['POST'])
def start():
    if 'round' not in session:
        session['round'] = 1
    else:
        session['round'] += 1

    real_dir = os.path.join('static', 'real_images')
    fake_dir = os.path.join('static', 'fake_images')
    real_images = [os.path.join('real_images', img) for img in random.sample(os.listdir(real_dir), 3)]
    fake_images = [os.path.join('fake_images', img) for img in random.sample(os.listdir(fake_dir), 3)]
    images = real_images + fake_images
    random.shuffle(images)
    session['fake_images'] = fake_images
    return jsonify(images=images, round=session['round'])


@app.route('/submit', methods=['POST'])
def submit():
    selections = request.get_json()
    fake_images = session.get('fake_images', [])
    correct = [img for img in selections if img in fake_images]
    incorrect = [img for img in fake_images if img not in correct]

    # calculate correct and incorrect answers for this round
    round_correct = len(correct)
    round_incorrect = len(incorrect)

    # update total scores in session
    session['total_correct'] = session.get('total_correct', 0) + round_correct
    session['total_incorrect'] = session.get('total_incorrect', 0) + round_incorrect

    return jsonify(correct_guesses=correct, incorrect_guesses=incorrect, 
                   total_correct=session['total_correct'], total_incorrect=session['total_incorrect'],
                   round=session['round'], fake_images=fake_images)



@app.route('/reset', methods=['POST'])
def reset():
    session.clear()
    return jsonify(success=True)


if __name__ == "__main__":
    app.run(debug=True)
