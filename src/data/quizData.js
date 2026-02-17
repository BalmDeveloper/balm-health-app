// Categorized quiz data with 11 categories, 10 questions each
export const quizCategories = {
  'WOMENS_HEALTH': {
    title: 'Women\'s Health',
    icon: 'female-outline',
    color: '#ff69b4',
    questions: [
      {
        q: 'At what age should women begin regular mammograms?',
        a: [
          { text: '30 years', correct: false },
          { text: '40-45 years', correct: true },
          { text: '50 years', correct: false },
          { text: '60 years', correct: false },
        ],
        info: 'Most guidelines recommend starting mammograms at age 40-45.\n\nSource: American Cancer Society Guidelines, 2023 - Women 40-44 have option to start annual mammograms; women 45-54 should get yearly mammograms.'
      },
      {
        q: 'Which nutrient is especially important for women during childbearing years?',
        a: [
          { text: 'Vitamin C', correct: false },
          { text: 'Folic acid', correct: true },
          { text: 'Vitamin D', correct: false },
          { text: 'Iron', correct: false },
        ],
        info: 'Folic acid helps prevent birth defects during early pregnancy.\n\nSource: CDC - All women capable of becoming pregnant should get 400 mcg of folic acid daily to prevent neural tube defects.'
      },
      {
        q: 'What is the average length of a menstrual cycle?',
        a: [
          { text: '14 days', correct: false },
          { text: '21 days', correct: false },
          { text: '28 days', correct: true },
          { text: '35 days', correct: false },
        ],
        info: 'The average menstrual cycle is about 28 days, but can range from 21-35 days.\n\nSource: NIH Eunice Kennedy Shriver National Institute of Child Health and Human Development - Normal cycle length is 28 days with 21-35 day range.'
      },
      {
        q: 'Which condition affects about 10% of women of reproductive age?',
        a: [
          { text: 'Endometriosis', correct: true },
          { text: 'Ovarian cancer', correct: false },
          { text: 'Uterine fibroids', correct: false },
          { text: 'Pelvic inflammatory disease', correct: false },
        ],
        info: 'Endometriosis affects approximately 10% of women worldwide.\n\nSource: World Health Organization (WHO) - Endometriosis affects an estimated 10% (190 million) of reproductive age women globally.'
      },
      {
        q: 'What is the primary cause of osteoporosis in women?',
        a: [
          { text: 'Excess calcium', correct: false },
          { text: 'Estrogen deficiency', correct: true },
          { text: 'Too much exercise', correct: false },
          { text: 'High protein intake', correct: false },
        ],
        info: 'Estrogen deficiency, especially after menopause, is the main cause of bone loss.\n\nSource: USPSTF Osteoporosis Guidelines - Estrogen deficiency after menopause is primary cause of decreased bone density.'
      },
      {
        q: 'How often should women have a Pap smear?',
        a: [
          { text: 'Every month', correct: false },
          { text: 'Every 3 years', correct: true },
          { text: 'Every 5 years', correct: false },
          { text: 'Every 10 years', correct: false },
        ],
        info: 'Guidelines recommend Pap smears every 3 years for most women.\n\nSource: American College of Obstetricians and Gynecologists (ACOG) - Women 21-29 should have Pap test alone every 3 years.'
      },
      {
        q: 'Which hormone is primarily responsible for regulating the menstrual cycle?',
        a: [
          { text: 'Insulin', correct: false },
          { text: 'Estrogen', correct: true },
          { text: 'Cortisol', correct: false },
          { text: 'Testosterone', correct: false },
        ],
        info: 'Estrogen and progesterone work together to regulate the menstrual cycle.'
      },
      {
        q: 'What is the most common symptom of menopause?',
        a: [
          { text: 'Weight gain', correct: false },
          { text: 'Hot flashes', correct: true },
          { text: 'Hair loss', correct: false },
          { text: 'Headaches', correct: false },
        ],
        info: 'Hot flashes affect about 75% of women during menopause.\n\nSource: NIH National Library of Medicine - Clinical studies show hot flashes occur in >75% of menopausal women.'
      },
      {
        q: 'Which exercise is particularly beneficial for pelvic floor health?',
        a: [
          { text: 'Kegel exercises', correct: true },
          { text: 'Running', correct: false },
          { text: 'Weight lifting', correct: false },
          { text: 'Swimming', correct: false },
        ],
        info: 'Kegel exercises strengthen pelvic floor muscles and prevent incontinence.'
      },
      {
        q: 'What is the recommended daily calcium intake for adult women?',
        a: [
          { text: '500 mg', correct: false },
          { text: '1000 mg', correct: true },
          { text: '2000 mg', correct: false },
          { text: '3000 mg', correct: false },
        ],
        info: 'Adult women need about 1000 mg of calcium daily for bone health.\n\nSource: International Osteoporosis Foundation - Recommended dietary calcium intake is 800-1000 mg per day for adults.'
      }
    ]
  },
  'PREVENTIVE_HEALTH': {
    title: 'Preventive Health',
    icon: 'shield-checkmark-outline',
    color: '#4CAF50',
    questions: [
      {
        q: 'How many minutes of moderate exercise are recommended per week for most adults?',
        a: [
          { text: '60 minutes', correct: false },
          { text: '150 minutes', correct: true },
          { text: '300 minutes', correct: false },
          { text: '30 minutes', correct: false },
        ],
        info: 'Aim for at least 150 minutes of moderate-intensity activity each week.'
      },
      {
        q: 'Which simple habit helps prevent the spread of many infections?',
        a: [
          { text: 'Frequent hand-washing', correct: true },
          { text: 'Skipping breakfast', correct: false },
          { text: 'Late-night snacking', correct: false },
          { text: 'Sitting for long hours', correct: false },
        ],
        info: 'Washing hands with soap for 20 seconds is one of the easiest ways to stay healthy.'
      },
      {
        q: 'What is the best first aid step for a minor cut?',
        a: [
          { text: 'Apply crushed ice', correct: false },
          { text: 'Clean with running water', correct: true },
          { text: 'Cover with dirt', correct: false },
          { text: 'Remove surrounding skin', correct: false },
        ],
        info: 'Rinsing removes dirt/bacteria before bandaging.'
      },
      {
        q: 'How often should adults have their blood pressure checked if normal?',
        a: [
          { text: 'Every 1–2 years', correct: true },
          { text: 'Once a decade', correct: false },
          { text: 'Never', correct: false },
          { text: 'Monthly', correct: false },
        ],
        info: 'Regular screening catches early hypertension.'
      },
      {
        q: 'Which vaccination is recommended annually for most adults?',
        a: [
          { text: 'Tetanus', correct: false },
          { text: 'Flu shot', correct: true },
          { text: 'MMR', correct: false },
          { text: 'Hepatitis B', correct: false },
        ],
        info: 'Annual flu vaccines protect against seasonal influenza strains.'
      },
      {
        q: 'What is a simple way to protect your skin from harmful UV rays?',
        a: [
          { text: 'Apply broad-spectrum sunscreen', correct: true },
          { text: 'Skip shade at noon', correct: false },
          { text: 'Use tanning beds', correct: false },
          { text: 'Wear dark glasses only', correct: false },
        ],
        info: 'Use SPF 30+ sunscreen and reapply every two hours when outdoors.'
      },
      {
        q: 'Which screening test helps detect colon cancer early?',
        a: [
          { text: 'Blood test', correct: false },
          { text: 'Colonoscopy', correct: true },
          { text: 'X-ray', correct: false },
          { text: 'MRI', correct: false },
        ],
        info: 'Colonoscopies can detect and remove precancerous polyps.'
      },
      {
        q: 'What is the recommended cholesterol screening frequency for adults?',
        a: [
          { text: 'Every 6 months', correct: false },
          { text: 'Every 4-6 years', correct: true },
          { text: 'Every 10 years', correct: false },
          { text: 'Only if symptomatic', correct: false },
        ],
        info: 'Most adults should have cholesterol checked every 4-6 years.'
      },
      {
        q: 'Which practice helps manage stress levels?',
        a: [
          { text: 'Deep-breathing exercises', correct: true },
          { text: 'Skipping meals', correct: false },
          { text: 'Over-consuming caffeine', correct: false },
          { text: 'Multitasking constantly', correct: false },
        ],
        info: 'Mindful breathing calms the nervous system.'
      },
      {
        q: 'Flossing helps prevent build-up of what between teeth?',
        a: [
          { text: 'Plaque', correct: true },
          { text: 'Calcium', correct: false },
          { text: 'Hemoglobin', correct: false },
          { text: 'Keratin', correct: false },
        ],
        info: 'Removing plaque reduces cavities and gum disease.'
      }
    ]
  },
  'MENS_HEALTH': {
    title: 'Men\'s Health',
    icon: 'male-outline',
    color: '#2196F3',
    questions: [
      {
        q: 'At what age should men begin regular prostate cancer screening?',
        a: [
          { text: '30 years', correct: false },
          { text: '40 years', correct: false },
          { text: '45-50 years', correct: true },
          { text: '60 years', correct: false },
        ],
        info: 'Most guidelines recommend prostate screening starting at age 45-50.'
      },
      {
        q: 'Which condition affects about 1 in 8 men during their lifetime?',
        a: [
          { text: 'Heart disease', correct: false },
          { text: 'Prostate cancer', correct: true },
          { text: 'Diabetes', correct: false },
          { text: 'Stroke', correct: false },
        ],
        info: 'Prostate cancer affects approximately 1 in 8 men.'
      },
      {
        q: 'What is the leading cause of death in men?',
        a: [
          { text: 'Cancer', correct: false },
          { text: 'Heart disease', correct: true },
          { text: 'Accidents', correct: false },
          { text: 'Stroke', correct: false },
        ],
        info: 'Heart disease is the leading cause of death for men in most countries.'
      },
      {
        q: 'Which symptom should men never ignore?',
        a: [
          { text: 'Occasional headache', correct: false },
          { text: 'Chest pain', correct: true },
          { text: 'Mild fatigue', correct: false },
          { text: 'Occasional indigestion', correct: false },
        ],
        info: 'Chest pain can be a sign of heart attack and requires immediate attention.'
      },
      {
        q: 'What is erectile dysfunction often a sign of?',
        a: [
          { text: 'Normal aging', correct: false },
          { text: 'Underlying health conditions', correct: true },
          { text: 'Lack of exercise', correct: false },
          { text: 'Too much sleep', correct: false },
        ],
        info: 'ED can indicate heart disease, diabetes, or other health issues.'
      },
      {
        q: 'Which test is important for men over 50?',
        a: [
          { text: 'Pregnancy test', correct: false },
          { text: 'PSA test', correct: true },
          { text: 'Pap smear', correct: false },
          { text: 'Mammogram', correct: false },
        ],
        info: 'PSA tests help screen for prostate cancer.'
      },
      {
        q: 'What is the recommended daily fiber intake for men?',
        a: [
          { text: '15 grams', correct: false },
          { text: '30-38 grams', correct: true },
          { text: '50 grams', correct: false },
          { text: '10 grams', correct: false },
        ],
        info: 'Men need 30-38 grams of fiber daily for digestive health.'
      },
      {
        q: 'Which condition are men more likely to develop than women?',
        a: [
          { text: 'Osteoporosis', correct: false },
          { text: 'Gout', correct: true },
          { text: 'Migraines', correct: false },
          { text: 'Autoimmune diseases', correct: false },
        ],
        info: 'Gout affects men more frequently than women.'
      },
      {
        q: 'What is a major risk factor for testicular cancer?',
        a: [
          { text: 'Undescended testicle', correct: true },
          { text: 'Too much exercise', correct: false },
          { text: 'High protein diet', correct: false },
          { text: 'Frequent cycling', correct: false },
        ],
        info: 'Undescended testicle is a significant risk factor for testicular cancer.'
      },
      {
        q: 'How often should men perform testicular self-exams?',
        a: [
          { text: 'Once a year', correct: false },
          { text: 'Monthly', correct: true },
          { text: 'Weekly', correct: false },
          { text: 'Never', correct: false },
        ],
        info: 'Monthly self-exams help detect changes early.'
      }
    ]
  },
  'PCOS': {
    title: 'PCOS',
    icon: 'medical-outline',
    color: '#9C27B0',
    questions: [
      {
        q: 'What does PCOS stand for?',
        a: [
          { text: 'Polycystic Ovary Syndrome', correct: true },
          { text: 'Premature Cancer Ovarian Syndrome', correct: false },
          { text: 'Postpartum Complications Syndrome', correct: false },
          { text: 'Pelvic Cystic Ovary Syndrome', correct: false },
        ],
        info: 'PCOS is Polycystic Ovary Syndrome.'
      },
      {
        q: 'Which hormone is typically elevated in PCOS?',
        a: [
          { text: 'Estrogen', correct: false },
          { text: 'Insulin', correct: true },
          { text: 'Progesterone', correct: false },
          { text: 'Thyroid hormone', correct: false },
        ],
        info: 'Insulin resistance is common in women with PCOS.'
      },
      {
        q: 'What is a common symptom of PCOS?',
        a: [
          { text: 'Weight loss', correct: false },
          { text: 'Irregular periods', correct: true },
          { text: 'Low blood pressure', correct: false },
          { text: 'Excessive sleep', correct: false },
        ],
        info: 'Irregular menstrual cycles are a hallmark symptom of PCOS.'
      },
      {
        q: 'Which lifestyle change helps manage PCOS?',
        a: [
          { text: 'High sugar diet', correct: false },
          { text: 'Regular exercise', correct: true },
          { text: 'Sedentary lifestyle', correct: false },
          { text: 'Smoking', correct: false },
        ],
        info: 'Exercise improves insulin sensitivity in PCOS.'
      },
      {
        q: 'What percentage of women of reproductive age have PCOS?',
        a: [
          { text: '1-2%', correct: false },
          { text: '6-12%', correct: true },
          { text: '25-30%', correct: false },
          { text: '40-50%', correct: false },
        ],
        info: 'PCOS affects 6-12% of women of reproductive age.'
      },
      {
        q: 'Which medication is commonly used to treat PCOS?',
        a: [
          { text: 'Antibiotics', correct: false },
          { text: 'Metformin', correct: true },
          { text: 'Antihistamines', correct: false },
          { text: 'Pain relievers', correct: false },
        ],
        info: 'Metformin helps improve insulin sensitivity in PCOS.'
      },
      {
        q: 'What is a common skin manifestation of PCOS?',
        a: [
          { text: 'Dry skin', correct: false },
          { text: 'Acne', correct: true },
          { text: 'Pale skin', correct: false },
          { text: 'Freckles', correct: false },
        ],
        info: 'Hormonal imbalances in PCOS often cause acne.'
      },
      {
        q: 'Which dietary approach is recommended for PCOS?',
        a: [
          { text: 'High glycemic index foods', correct: false },
          { text: 'Low glycemic index foods', correct: true },
          { text: 'High fat diet', correct: false },
          { text: 'Liquid diet only', correct: false },
        ],
        info: 'Low GI foods help manage blood sugar in PCOS.'
      },
      {
        q: 'What is a long-term complication of untreated PCOS?',
        a: [
          { text: 'Type 2 diabetes', correct: true },
          { text: 'Hearing loss', correct: false },
          { text: 'Vision improvement', correct: false },
          { text: 'Height increase', correct: false },
        ],
        info: 'PCOS increases risk of type 2 diabetes if untreated.'
      },
      {
        q: 'Which symptom affects hair growth in PCOS?',
        a: [
          { text: 'Hair loss on scalp', correct: false },
          { text: 'Excess hair growth', correct: true },
          { text: 'No hair changes', correct: false },
          { text: 'Instant graying', correct: false },
        ],
        info: 'PCOS can cause hirsutism (excess hair growth).'
      }
    ]
  },
  'TRYING_TO_CONCEIVE': {
    title: 'Trying to Conceive',
    icon: 'heart-outline',
    color: '#E91E63',
    questions: [
      {
        q: 'What is the fertile window in a typical 28-day cycle?',
        a: [
          { text: 'Days 1-7', correct: false },
          { text: 'Days 8-14', correct: false },
          { text: 'Days 12-16', correct: true },
          { text: 'Days 20-28', correct: false },
        ],
        info: 'The fertile window typically includes days 12-16 of a 28-day cycle.'
      },
      {
        q: 'Which vitamin is crucial before and during early pregnancy?',
        a: [
          { text: 'Vitamin C', correct: false },
          { text: 'Folic acid', correct: true },
          { text: 'Vitamin D', correct: false },
          { text: 'Vitamin E', correct: false },
        ],
        info: 'Folic acid prevents neural tube defects in early pregnancy.'
      },
      {
        q: 'How long should couples try to conceive before seeking help?',
        a: [
          { text: '1 month', correct: false },
          { text: '3 months', correct: false },
          { text: '6 months', correct: false },
          { text: '12 months', correct: true },
        ],
        info: 'Couples under 35 should try for 12 months before seeking fertility help.'
      },
      {
        q: 'Which factor can negatively affect fertility in men?',
        a: [
          { text: 'Regular exercise', correct: false },
          { text: 'Excessive heat', correct: true },
          { text: 'Healthy diet', correct: false },
          { text: 'Adequate sleep', correct: false },
        ],
        info: 'High temperatures can reduce sperm production and quality.'
      },
      {
        q: 'What is ovulation?',
        a: [
          { text: 'Menstrual bleeding', correct: false },
          { text: 'Release of an egg', correct: true },
          { text: 'Implantation', correct: false },
          { text: 'Fertilization', correct: false },
        ],
        info: 'Ovulation is when an ovary releases a mature egg.'
      },
      {
        q: 'Which age group has the highest fertility rates?',
        a: [
          { text: 'Teens', correct: false },
          { text: '20s', correct: true },
          { text: '30s', correct: false },
          { text: '40s', correct: false },
        ],
        info: 'Fertility peaks in the 20s and gradually declines after 30.'
      },
      {
        q: 'What can help track ovulation?',
        a: [
          { text: 'Basal body temperature', correct: true },
          { text: 'Blood pressure', correct: false },
          { text: 'Heart rate', correct: false },
          { text: 'Respiratory rate', correct: false },
        ],
        info: 'BBT rises slightly after ovulation and can help track fertility.'
      },
      {
        q: 'Which lifestyle factor improves fertility?',
        a: [
          { text: 'Smoking', correct: false },
          { text: 'Moderate exercise', correct: true },
          { text: 'Excessive alcohol', correct: false },
          { text: 'Extreme dieting', correct: false },
        ],
        info: 'Healthy lifestyle choices improve fertility outcomes.'
      },
      {
        q: 'What is implantation?',
        a: [
          { text: 'Fertilization', correct: false },
          { text: 'Egg attachment to uterus', correct: true },
          { text: 'Menstruation', correct: false },
          { text: 'Ovulation', correct: false },
        ],
        info: 'Implantation is when a fertilized egg attaches to the uterine lining.'
      },
      {
        q: 'Which substance should be avoided when trying to conceive?',
        a: [
          { text: 'Water', correct: false },
          { text: 'Alcohol', correct: true },
          { text: 'Fruits', correct: false },
          { text: 'Vegetables', correct: false },
        ],
        info: 'Alcohol can negatively affect fertility and early pregnancy.'
      }
    ]
  },
  'NUTRITION': {
    title: 'Nutrition',
    icon: 'restaurant-outline',
    color: '#FF9800',
    questions: [
      {
        q: 'Around what portion of your plate should be filled with fruits and vegetables?',
        a: [
          { text: 'One-quarter', correct: false },
          { text: 'Half', correct: true },
          { text: 'None', correct: false },
          { text: 'Three-quarters', correct: false },
        ],
        info: 'Filling half your plate with colorful produce boosts vitamins and minerals.'
      },
      {
        q: 'Which drink is best for staying hydrated throughout the day?',
        a: [
          { text: 'Sugary soda', correct: false },
          { text: 'Water', correct: true },
          { text: 'Energy drink', correct: false },
          { text: 'Sweet tea', correct: false },
        ],
        info: 'Plain water keeps you hydrated without extra calories or sugar.'
      },
      {
        q: 'Which grain is considered a whole grain and high in fiber?',
        a: [
          { text: 'White rice', correct: false },
          { text: 'Quinoa', correct: true },
          { text: 'Enriched pasta', correct: false },
          { text: 'Pastry flour', correct: false },
        ],
        info: 'Quinoa is a whole grain packed with fiber and protein.'
      },
      {
        q: 'Which macronutrient should make up the largest portion of daily calories?',
        a: [
          { text: 'Protein', correct: false },
          { text: 'Fats', correct: false },
          { text: 'Carbohydrates', correct: true },
          { text: 'Alcohol', correct: false },
        ],
        info: 'Healthy carbohydrates such as whole grains supply energy.'
      },
      {
        q: 'Which fat type is heart-healthy and found in olive oil?',
        a: [
          { text: 'Trans fat', correct: false },
          { text: 'Saturated fat', correct: false },
          { text: 'Monounsaturated fat', correct: true },
          { text: 'Hydrogenated fat', correct: false },
        ],
        info: 'Monounsaturated fats can improve cholesterol levels.'
      },
      {
        q: 'Eating plenty of ____ can help lower LDL "bad" cholesterol.',
        a: [
          { text: 'Soluble fiber', correct: true },
          { text: 'Added sugars', correct: false },
          { text: 'Trans fats', correct: false },
          { text: 'Sodium', correct: false },
        ],
        info: 'Oats, beans and apples supply soluble fiber.'
      },
      {
        q: 'To aid digestion, nutritionists recommend at least how many grams of fiber per day for adults?',
        a: [
          { text: '5 g', correct: false },
          { text: '15 g', correct: false },
          { text: '25–30 g', correct: true },
          { text: '60 g', correct: false },
        ],
        info: 'Aim for 25–30 g of fiber from whole foods daily.'
      },
      {
        q: 'Which food group is a primary source of calcium?',
        a: [
          { text: 'Dairy products', correct: true },
          { text: 'Lean meats', correct: false },
          { text: 'Root vegetables', correct: false },
          { text: 'Citrus fruits', correct: false },
        ],
        info: 'Milk, yogurt and cheese are calcium-rich.'
      },
      {
        q: 'Which food is a plant-based source of complete protein?',
        a: [
          { text: 'Lentils', correct: false },
          { text: 'Chia seeds', correct: false },
          { text: 'Soybeans', correct: true },
          { text: 'Almonds', correct: false },
        ],
        info: 'Soy contains all nine essential amino acids.'
      },
      {
        q: 'What kitchen method retains most nutrients when cooking vegetables?',
        a: [
          { text: 'Steaming', correct: true },
          { text: 'Boiling for long time', correct: false },
          { text: 'Deep-frying', correct: false },
          { text: 'Charbroiling', correct: false },
        ],
        info: 'Steaming minimizes nutrient loss.'
      }
    ]
  },
  'FERTILITY': {
    title: 'Fertility',
    icon: 'water-outline',
    color: '#00BCD4',
    questions: [
      {
        q: 'What is the average sperm count per milliliter for healthy men?',
        a: [
          { text: '1 million', correct: false },
          { text: '15 million', correct: true },
          { text: '100 million', correct: false },
          { text: '500 million', correct: false },
        ],
        info: 'Normal sperm count is at least 15 million per milliliter.'
      },
      {
        q: 'Which hormone triggers ovulation?',
        a: [
          { text: 'Estrogen', correct: false },
          { text: 'LH surge', correct: true },
          { text: 'Progesterone', correct: false },
          { text: 'FSH', correct: false },
        ],
        info: 'The LH surge triggers egg release about 24-36 hours later.'
      },
      {
        q: 'What is the most common cause of female infertility?',
        a: [
          { text: 'Age', correct: false },
          { text: 'Ovulation disorders', correct: true },
          { text: 'Blocked tubes', correct: false },
          { text: 'Uterine issues', correct: false },
        ],
        info: 'Ovulation problems are the most common cause of female infertility.'
      },
      {
        q: 'Which test evaluates male fertility?',
        a: [
          { text: 'Blood test', correct: false },
          { text: 'Semen analysis', correct: true },
          { text: 'Ultrasound', correct: false },
          { text: 'X-ray', correct: false },
        ],
        info: 'Semen analysis evaluates sperm count, motility, and morphology.'
      },
      {
        q: 'What is IVF?',
        a: [
          { text: 'Invasive surgery', correct: false },
          { text: 'In vitro fertilization', correct: true },
          { text: 'Infection treatment', correct: false },
          { text: 'Iron vitamin formula', correct: false },
        ],
        info: 'IVF involves fertilizing eggs outside the body and transferring them to the uterus.'
      },
      {
        q: 'Which factor can damage sperm quality?',
        a: [
          { text: 'Cold showers', correct: false },
          { text: 'Hot tubs', correct: true },
          { text: 'Exercise', correct: false },
          { text: 'Healthy diet', correct: false },
        ],
        info: 'High temperatures can impair sperm production and function.'
      },
      {
        q: 'What is the success rate of IVF per cycle?',
        a: [
          { text: '5%', correct: false },
          { text: '30-40%', correct: true },
          { text: '70%', correct: false },
          { text: '95%', correct: false },
        ],
        info: 'IVF success rates vary but average around 30-40% per cycle.'
      },
      {
        q: 'Which vitamin supports sperm health?',
        a: [
          { text: 'Vitamin D', correct: false },
          { text: 'Zinc', correct: true },
          { text: 'Vitamin K', correct: false },
          { text: 'Iron', correct: false },
        ],
        info: 'Zinc is essential for sperm production and testosterone levels.'
      },
      {
        q: 'What is endometriosis?',
        a: [
          { text: 'Uterine cancer', correct: false },
          { text: 'Tissue growing outside uterus', correct: true },
          { text: 'Normal period', correct: false },
          { text: 'Pregnancy complication', correct: false },
        ],
        info: 'Endometriosis is when uterine-like tissue grows outside the uterus.'
      },
      {
        q: 'Which lifestyle factor improves fertility?',
        a: [
          { text: 'Smoking', correct: false },
          { text: 'Stress management', correct: true },
          { text: 'Excessive caffeine', correct: false },
          { text: 'Poor sleep', correct: false },
        ],
        info: 'Managing stress can improve hormonal balance and fertility.'
      }
    ]
  },
  'BPA': {
    title: 'BPA',
    icon: 'flask-outline',
    color: '#795548',
    questions: [
      {
        q: 'What does BPA stand for?',
        a: [
          { text: 'Bisphenol A', correct: true },
          { text: 'Basic Plastic Additive', correct: false },
          { text: 'Biological Product Agent', correct: false },
          { text: 'Bacterial Protection Agent', correct: false },
        ],
        info: 'BPA is Bisphenol A, a chemical used in plastics.'
      },
      {
        q: 'Which products commonly contain BPA?',
        a: [
          { text: 'Fresh fruits', correct: false },
          { text: 'Plastic water bottles', correct: true },
          { text: 'Glass containers', correct: false },
          { text: 'Wood products', correct: false },
        ],
        info: 'BPA is found in many plastic containers and linings.'
      },
      {
        q: 'What health concern is associated with BPA?',
        a: [
          { text: 'Hormone disruption', correct: true },
          { text: 'Vitamin deficiency', correct: false },
          { text: 'Bone strengthening', correct: false },
          { text: 'Improved digestion', correct: false },
        ],
        info: 'BPA can interfere with hormone function in the body.'
      },
      {
        q: 'Which recycling number often indicates BPA-containing plastic?',
        a: [
          { text: '#1', correct: false },
          { text: '#3', correct: false },
          { text: '#7', correct: true },
          { text: '#5', correct: false },
        ],
        info: 'Plastic #7 often contains BPA, though not always.'
      },
      {
        q: 'What is the safest alternative to BPA-containing plastics?',
        a: [
          { text: 'More plastic', correct: false },
          { text: 'Glass or stainless steel', correct: true },
          { text: 'Aluminum cans', correct: false },
          { text: 'Foam containers', correct: false },
        ],
        info: 'Glass and stainless steel don\'t leach harmful chemicals.'
      },
      {
        q: 'Which action reduces BPA exposure?',
        a: [
          { text: 'Microwaving in plastic', correct: false },
          { text: 'Using glass containers', correct: true },
          { text: 'Reusing single-use bottles', correct: false },
          { text: 'Storing hot food in plastic', correct: false },
        ],
        info: 'Avoid heating food in plastic containers to reduce BPA leaching.'
      },
      {
        q: 'Which population is most vulnerable to BPA effects?',
        a: [
          { text: 'Elderly', correct: false },
          { text: 'Pregnant women and infants', correct: true },
          { text: 'Adult men', correct: false },
          { text: 'Teenagers', correct: false },
        ],
        info: 'Developing fetuses and infants are most sensitive to BPA.'
      },
      {
        q: 'What does "BPA-free" mean?',
        a: [
          { text: 'No plastic at all', correct: false },
          { text: 'No BPA chemical', correct: true },
          { text: 'Completely natural', correct: false },
          { text: 'Biodegradable', correct: false },
        ],
        info: 'BPA-free products don\'t contain Bisphenol A but may have other chemicals.'
      },
      {
        q: 'Which government agency regulates BPA?',
        a: [
          { text: 'NASA', correct: false },
          { text: 'FDA', correct: true },
          { text: 'FBI', correct: false },
          { text: 'CIA', correct: false },
        ],
        info: 'The FDA regulates BPA use in food containers.'
      },
      {
        q: 'What is a common source of BPA exposure?',
        a: [
          { text: 'Canned food linings', correct: true },
          { text: 'Fresh vegetables', correct: false },
          { text: 'Tap water', correct: false },
          { text: 'Air pollution', correct: false },
        ],
        info: 'Many canned foods have BPA in their protective linings.'
      }
    ]
  },
  'NUTRITION_2': {
    title: 'Advanced Nutrition',
    icon: 'leaf-outline',
    color: '#8BC34A',
    questions: [
      {
        q: 'Which antioxidant is abundant in berries?',
        a: [
          { text: 'Anthocyanins', correct: true },
          { text: 'Lycopene', correct: false },
          { text: 'Beta-carotene', correct: false },
          { text: 'Lutein', correct: false },
        ],
        info: 'Anthocyanins give berries their red, purple, and blue colors.'
      },
      {
        q: 'What is the glycemic index?',
        a: [
          { text: 'Food temperature scale', correct: false },
          { text: 'Blood sugar impact measure', correct: true },
          { text: 'Protein content rating', correct: false },
          { text: 'Fat content scale', correct: false },
        ],
        info: 'GI measures how quickly foods raise blood sugar levels.'
      },
      {
        q: 'Which fat is essential but must be obtained from diet?',
        a: [
          { text: 'Saturated fat', correct: false },
          { text: 'Omega-3 fatty acids', correct: true },
          { text: 'Trans fat', correct: false },
          { text: 'Monounsaturated fat', correct: false },
        ],
        info: 'Omega-3s are essential fats the body can\'t produce.'
      },
      {
        q: 'What is probiotic?',
        a: [
          { text: 'Harmful bacteria', correct: false },
          { text: 'Beneficial bacteria', correct: true },
          { text: 'Virus', correct: false },
          { text: 'Fungus', correct: false },
        ],
        info: 'Probiotics are beneficial gut bacteria.'
      },
      {
        q: 'Which vitamin is fat-soluble?',
        a: [
          { text: 'Vitamin C', correct: false },
          { text: 'Vitamin B12', correct: false },
          { text: 'Vitamin D', correct: true },
          { text: 'Vitamin B6', correct: false },
        ],
        info: 'Vitamins A, D, E, and K are fat-soluble.'
      },
      {
        q: 'What is the recommended daily sodium intake?',
        a: [
          { text: '500 mg', correct: false },
          { text: '2300 mg', correct: true },
          { text: '5000 mg', correct: false },
          { text: '10000 mg', correct: false },
        ],
        info: 'Most adults should limit sodium to 2300 mg per day.'
      },
      {
        q: 'Which food contains complete protein?',
        a: [
          { text: 'Rice', correct: false },
          { text: 'Eggs', correct: true },
          { text: 'Beans', correct: false },
          { text: 'Corn', correct: false },
        ],
        info: 'Animal products and soy are complete protein sources.'
      },
      {
        q: 'What is ketosis?',
        a: [
          { text: 'High blood sugar', correct: false },
          { text: 'Fat-burning state', correct: true },
          { text: 'Protein digestion', correct: false },
          { text: 'Carb storage', correct: false },
        ],
        info: 'Ketosis occurs when the body burns fat for fuel instead of carbs.'
      },
      {
        q: 'Which mineral supports thyroid function?',
        a: [
          { text: 'Calcium', correct: false },
          { text: 'Iodine', correct: true },
          { text: 'Iron', correct: false },
          { text: 'Zinc', correct: false },
        ],
        info: 'Iodine is essential for thyroid hormone production.'
      },
      {
        q: 'What is the most bioavailable form of iron?',
        a: [
          { text: 'Plant iron', correct: false },
          { text: 'Heme iron', correct: true },
          { text: 'Supplement iron', correct: false },
          { text: 'Fortified iron', correct: false },
        ],
        info: 'Heme iron from animal sources is most easily absorbed.'
      }
    ]
  },
  'FITNESS': {
    title: 'Fitness',
    icon: 'fitness-outline',
    color: '#F44336',
    questions: [
      {
        q: 'What is the recommended daily step goal for general health?',
        a: [
          { text: '2,000 steps', correct: false },
          { text: '5,000 steps', correct: false },
          { text: '10,000 steps', correct: true },
          { text: '20,000 steps', correct: false },
        ],
        info: 'Aiming for about 10,000 steps helps maintain an active lifestyle.'
      },
      {
        q: 'Regular stretching most directly improves which fitness component?',
        a: [
          { text: 'Flexibility', correct: true },
          { text: 'Power', correct: false },
          { text: 'Speed', correct: false },
          { text: 'Coordination', correct: false },
        ],
        info: 'Stretching keeps joints limber and reduces injury risk.'
      },
      {
        q: 'What type of exercise strengthens bones best?',
        a: [
          { text: 'Swimming', correct: false },
          { text: 'Cycling', correct: false },
          { text: 'Weight-bearing exercise', correct: true },
          { text: 'Meditation', correct: false },
        ],
        info: 'Activities like walking, running and strength training stress bones to keep them strong.'
      },
      {
        q: 'Which activity can help strengthen the core muscles?',
        a: [
          { text: 'Plank', correct: true },
          { text: 'Watching TV', correct: false },
          { text: 'Typing', correct: false },
          { text: 'Reading', correct: false },
        ],
        info: 'Planking engages abdominal and back muscles.'
      },
      {
        q: 'What is the recommended rest time between strength training sets?',
        a: [
          { text: '10 seconds', correct: false },
          { text: '30-90 seconds', correct: true },
          { text: '5 minutes', correct: false },
          { text: 'No rest needed', correct: false },
        ],
        info: 'Rest 30-90 seconds between sets for optimal recovery.'
      },
      {
        q: 'Which bodily system is most directly benefited by regular cardio exercise?',
        a: [
          { text: 'Cardiovascular system', correct: true },
          { text: 'Integumentary system', correct: false },
          { text: 'Skeletal system', correct: false },
          { text: 'Reproductive system', correct: false },
        ],
        info: 'Cardio strengthens the heart and lungs.'
      },
      {
        q: 'What is the ideal heart rate zone for moderate exercise?',
        a: [
          { text: '50-60% of max', correct: false },
          { text: '64-76% of max', correct: true },
          { text: '85-95% of max', correct: false },
          { text: '100% of max', correct: false },
        ],
        info: 'Moderate intensity is about 64-76% of maximum heart rate.'
      },
      {
        q: 'Which exercise is low-impact and joint-friendly?',
        a: [
          { text: 'Running on concrete', correct: false },
          { text: 'Swimming', correct: true },
          { text: 'Jumping rope', correct: false },
          { text: 'Box jumps', correct: false },
        ],
        info: 'Swimming provides excellent cardio with minimal joint stress.'
      },
      {
        q: 'What is DOMS?',
        a: [
          { text: 'Immediate energy', correct: false },
          { text: 'Muscle soreness', correct: true },
          { text: 'Flexibility measure', correct: false },
          { text: 'Strength test', correct: false },
        ],
        info: 'DOMS is delayed onset muscle soreness after exercise.'
      },
      {
        q: 'How often should adults do strength training?',
        a: [
          { text: 'Once a month', correct: false },
          { text: '2-3 times per week', correct: true },
          { text: 'Daily', correct: false },
          { text: 'Never', correct: false },
        ],
        info: '2-3 strength sessions per week provide optimal benefits.'
      }
    ]
  },
  'GENERAL': {
    title: 'General Health',
    icon: 'medical-outline',
    color: '#607D8B',
    questions: [
      {
        q: 'Which nutrient is crucial for healthy vision and immune function?',
        a: [
          { text: 'Vitamin A', correct: true },
          { text: 'Vitamin K', correct: false },
          { text: 'Calcium', correct: false },
          { text: 'Zinc', correct: false },
        ],
        info: 'Vitamin A supports eye health and immunity.'
      },
      {
        q: 'About how many hours of sleep do most adults need each night?',
        a: [
          { text: '4–5 hours', correct: false },
          { text: '6–8 hours', correct: true },
          { text: '9–10 hours', correct: false },
          { text: '11–12 hours', correct: false },
        ],
        info: 'Most adults benefit from 7–8 hours of quality sleep.'
      },
      {
        q: 'Which mineral helps regulate blood pressure and fluid balance?',
        a: [
          { text: 'Sodium', correct: false },
          { text: 'Potassium', correct: true },
          { text: 'Iodine', correct: false },
          { text: 'Chloride', correct: false },
        ],
        info: 'Potassium-rich foods like bananas support healthy blood pressure.'
      },
      {
        q: 'What is a common sign of dehydration?',
        a: [
          { text: 'Clear urine', correct: false },
          { text: 'Dark-yellow urine', correct: true },
          { text: 'Frequent yawning', correct: false },
          { text: 'Dilated pupils', correct: false },
        ],
        info: 'Dark urine often means you need more fluids.'
      },
      {
        q: 'Which vitamin is produced in the skin when exposed to sunlight?',
        a: [
          { text: 'Vitamin D', correct: true },
          { text: 'Vitamin E', correct: false },
          { text: 'Vitamin K', correct: false },
          { text: 'Vitamin B12', correct: false },
        ],
        info: 'Sunlight triggers vitamin D synthesis for bone health.'
      },
      {
        q: 'Which hormone helps the body use glucose for energy?',
        a: [
          { text: 'Cortisol', correct: false },
          { text: 'Insulin', correct: true },
          { text: 'Adrenaline', correct: false },
          { text: 'Melatonin', correct: false },
        ],
        info: 'Insulin unlocks cells so glucose can enter.'
      },
      {
        q: 'Which bodily organ filters blood and produces urine?',
        a: [
          { text: 'Kidneys', correct: true },
          { text: 'Liver', correct: false },
          { text: 'Pancreas', correct: false },
          { text: 'Spleen', correct: false },
        ],
        info: 'Kidneys remove waste and balance fluids.'
      },
      {
        q: 'Which spice contains curcumin, known for its anti-inflammatory properties?',
        a: [
          { text: 'Turmeric', correct: true },
          { text: 'Cinnamon', correct: false },
          { text: 'Pepper', correct: false },
          { text: 'Basil', correct: false },
        ],
        info: 'Curcumin gives turmeric its bright yellow color.'
      },
      {
        q: 'BMI stands for Body ____ Index.',
        a: [
          { text: 'Mass', correct: true },
          { text: 'Muscle', correct: false },
          { text: 'Metabolic', correct: false },
          { text: 'Marker', correct: false },
        ],
        info: 'BMI stands for Body Mass Index.'
      },
      {
        q: 'Which organ relies heavily on omega-3 fats for structure and function?',
        a: [
          { text: 'Brain', correct: true },
          { text: 'Gallbladder', correct: false },
          { text: 'Appendix', correct: false },
          { text: 'Bladder', correct: false },
        ],
        info: 'DHA, an omega-3, is a key component of brain tissue.'
      }
    ]
  }
};

// Export all questions as a flat array for backward compatibility
export default Object.values(quizCategories).flatMap(category => category.questions);
