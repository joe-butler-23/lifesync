export const mockWorkouts = [
  { id: 'w1', name: 'Push Day', duration: '45 min', calories: 320, difficulty: 'Intermediate', equipment: 'Dumbbells', source: 'local' },
  { id: 'w2', name: 'HIIT Cardio', duration: '30 min', calories: 285, difficulty: 'Beginner', equipment: 'Bodyweight', source: 'local' },
  { id: 'w3', name: 'Pull Day', duration: '50 min', calories: 340, difficulty: 'Intermediate', equipment: 'Resistance Bands', source: 'local' },
  { id: 'w4', name: 'Yoga Flow', duration: '35 min', calories: 150, difficulty: 'Beginner', equipment: 'Yoga Mat', source: 'local' },
  { id: 'w5', name: 'Leg Day', duration: '60 min', calories: 380, difficulty: 'Advanced', equipment: 'Weights', source: 'local' },
  { id: 'w6', name: 'Core Blast', duration: '20 min', calories: 180, difficulty: 'Intermediate', equipment: 'Bodyweight', source: 'local' },
  { id: 'w7', name: 'Swimming', duration: '40 min', calories: 400, difficulty: 'Intermediate', equipment: 'Pool', source: 'local' }
];

export const mockRecipes = [
  { 
    id: 'r1', 
    name: 'Mediterranean Quinoa Bowl', 
    cookTime: '25 min', 
    servings: 2,
    calories: 420, 
    difficulty: 'Easy',
    tags: ['Vegetarian', 'Gluten-Free', 'Healthy'],
    ingredients: ['Quinoa', 'Cherry tomatoes', 'Cucumber', 'Feta cheese', 'Olive oil', 'Lemon'],
    description: 'A fresh and healthy Mediterranean-inspired bowl with quinoa, vegetables, and feta cheese.',
    source: 'local'
  },
  { 
    id: 'r2',
    name: 'Salmon Teriyaki', 
    cookTime: '30 min', 
    servings: 2,
    calories: 380, 
    difficulty: 'Medium',
    tags: ['High-Protein', 'Gluten-Free', 'Low-Carb'],
    ingredients: ['Salmon fillets', 'Soy sauce', 'Honey', 'Ginger', 'Garlic', 'Broccoli'],
    description: 'Glazed salmon with a sweet and savoury teriyaki sauce, served with steamed broccoli.',
    source: 'local'
  },
  { 
    id: 'r3', 
    name: 'Veggie Stir Fry', 
    cookTime: '15 min', 
    servings: 2,
    calories: 320, 
    difficulty: 'Easy',
    tags: ['Vegan', 'Quick', 'Low-Calorie'],
    ingredients: ['Mixed vegetables', 'Soy sauce', 'Sesame oil', 'Garlic', 'Ginger', 'Rice'],
    description: 'Quick and easy vegetable stir fry with Asian flavours.',
    source: 'local'
  },
  { 
    id: 'r4', 
    name: 'Chicken Caesar Salad', 
    cookTime: '20 min', 
    servings: 2,
    calories: 350, 
    difficulty: 'Easy',
    tags: ['High-Protein', 'Low-Carb', 'Gluten-Free'],
    ingredients: ['Chicken breast', 'Romaine lettuce', 'Parmesan', 'Caesar dressing', 'Croutons'],
    description: 'Classic Caesar salad with grilled chicken breast and homemade dressing.',
    source: 'local'
  },
  { 
    id: 'r5', 
    name: 'Thai Green Curry', 
    cookTime: '35 min', 
    servings: 3,
    calories: 450, 
    difficulty: 'Medium',
    tags: ['Spicy', 'Coconut', 'Authentic'],
    ingredients: ['Green curry paste', 'Coconut milk', 'Chicken', 'Thai basil', 'Aubergine', 'Jasmine rice'],
    description: 'Aromatic Thai green curry with chicken and vegetables in creamy coconut milk.',
    source: 'local'
  },
  { 
    id: 'r6', 
    name: 'Avocado Toast', 
    cookTime: '10 min', 
    servings: 1,
    calories: 280, 
    difficulty: 'Easy',
    tags: ['Vegetarian', 'Quick', 'Breakfast'],
    ingredients: ['Sourdough bread', 'Avocado', 'Lemon', 'Salt', 'Pepper', 'Cherry tomatoes'],
    description: 'Simple but delicious avocado toast with fresh tomatoes and seasoning.',
    source: 'local'
  },
  { 
    id: 'r7', 
    name: 'Beef Bolognese', 
    cookTime: '45 min', 
    servings: 4,
    calories: 520, 
    difficulty: 'Medium',
    tags: ['Comfort Food', 'Italian', 'High-Protein'],
    ingredients: ['Ground beef', 'Tomatoes', 'Onion', 'Carrots', 'Celery', 'Pasta', 'Red wine'],
    description: 'Rich and hearty Italian meat sauce served with pasta.',
    source: 'local'
  },
  { 
    id: 'r8', 
    name: 'Greek Yogurt Parfait', 
    cookTime: '5 min', 
    servings: 1,
    calories: 220, 
    difficulty: 'Easy',
    tags: ['Healthy', 'Breakfast', 'High-Protein'],
    ingredients: ['Greek yogurt', 'Honey', 'Granola', 'Mixed berries', 'Nuts'],
    description: 'Layered yogurt parfait with fresh berries and crunchy granola.',
    source: 'local'
  }
];

export const mockEvents = [
  { id: 1, title: 'Team Meeting', time: '10:00 AM', source: 'google-cal', day: 'Mon' },
  { id: 2, title: 'Doctor Appointment', time: '2:30 PM', source: 'google-cal', day: 'Wed' },
  { id: 3, title: 'Date Night', time: '7:00 PM', source: 'google-cal', day: 'Fri' }
];

export const localTasks = [
  // Empty by default - can be populated as needed
];

export const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
