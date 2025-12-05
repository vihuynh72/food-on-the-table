-- Create learn_categories table
CREATE TABLE IF NOT EXISTS learn_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,           -- emoji or icon name
  color TEXT,          -- tailwind color class
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create learn_lessons table
CREATE TABLE IF NOT EXISTS learn_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES learn_categories(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('article', 'quiz')),
  duration INTEGER DEFAULT 1,         -- in minutes
  summary TEXT,                       -- 50-80 words
  content TEXT,                       -- markdown for articles, JSON for quizzes
  thumbnail TEXT,                     -- thumbnail URL or emoji
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  cta_type TEXT,                      -- 'triage', 'donate', 'community', null
  cta_label TEXT,                     -- custom CTA button text
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create learn_user_progress table
CREATE TABLE IF NOT EXISTS learn_user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES learn_lessons(id) ON DELETE CASCADE NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT now(),
  quiz_score INTEGER,                 -- percentage score for quizzes
  time_spent_seconds INTEGER,
  UNIQUE(user_id, lesson_id)
);

-- Enable Row Level Security
ALTER TABLE learn_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE learn_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE learn_user_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- learn_categories: Everyone can view categories
CREATE POLICY "Anyone can view learn categories" 
ON learn_categories FOR SELECT 
TO authenticated 
USING (true);

-- learn_lessons: Everyone can view lessons
CREATE POLICY "Anyone can view learn lessons" 
ON learn_lessons FOR SELECT 
TO authenticated 
USING (true);

-- learn_user_progress: Users can manage their own progress
CREATE POLICY "Users can view their own learn progress" 
ON learn_user_progress FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own learn progress" 
ON learn_user_progress FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own learn progress" 
ON learn_user_progress FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

-- Seed initial categories
INSERT INTO learn_categories (name, description, icon, color, sort_order) VALUES
  ('Food Safety', 'Quick tips to keep your family safe', '🛡️', 'woodland', 1),
  ('Storage Hacks', 'Make your food last longer', '📦', 'asparagus', 2),
  ('Donation Tips', 'Share food the right way', '🤝', 'pine-glade', 3),
  ('Compost', 'Turn scraps into gold', '🌱', 'desert-sand', 4),
  ('Planet Facts', 'Mind-blowing food waste stats', '🌍', 'raffia', 5);

-- ============================================
-- FOOD SAFETY - Quick Tips (< 20 seconds each)
-- ============================================

INSERT INTO learn_lessons (category_id, title, type, duration, content, thumbnail, tags, cta_type, sort_order)
SELECT c.id, 'The 2-Hour Rule ⏰', 'article', 1,
'**Left food out at a party?**

If it''s been sitting at room temperature for more than **2 hours**, toss it.

Bacteria doubles every 20 minutes in the "danger zone" (40-140°F).

🔥 Hot day above 90°F? Make that **1 hour**.',
'⏰', ARRAY['safety', 'quick'], 'triage', 1
FROM learn_categories c WHERE c.name = 'Food Safety';

INSERT INTO learn_lessons (category_id, title, type, duration, content, thumbnail, tags, sort_order)
SELECT c.id, 'Smell Test = Myth 👃', 'article', 1,
'**Think you can smell bad food?**

Nope! The bacteria that cause food poisoning are **odorless**.

Food can smell perfectly fine and still make you sick.

When in doubt, throw it out! 🗑️',
'👃', ARRAY['safety', 'myth'], 2
FROM learn_categories c WHERE c.name = 'Food Safety';

INSERT INTO learn_lessons (category_id, title, type, duration, content, thumbnail, tags, sort_order)
SELECT c.id, 'Raw Meat Rule 🥩', 'article', 1,
'**Always store raw meat on the bottom shelf!**

This prevents juices from dripping onto other foods.

Use a plate or container to catch any drips.

Simple change = safer fridge.',
'🥩', ARRAY['safety', 'storage'], 3
FROM learn_categories c WHERE c.name = 'Food Safety';

INSERT INTO learn_lessons (category_id, title, type, duration, content, thumbnail, tags, sort_order)
SELECT c.id, 'Food Safety Quiz 🧠', 'quiz', 2,
'[
  {
    "question": "How long can perishable food sit out safely?",
    "options": ["30 minutes", "2 hours", "4 hours", "All day"],
    "correctIndex": 1,
    "explanation": "The 2-hour rule! After that, bacteria grows rapidly."
  },
  {
    "question": "Can you always smell when food has gone bad?",
    "options": ["Yes, always", "No, not always", "Only with meat", "Only with dairy"],
    "correctIndex": 1,
    "explanation": "Many harmful bacteria are odorless. Trust dates, not your nose!"
  },
  {
    "question": "Where should raw meat go in the fridge?",
    "options": ["Top shelf", "Door", "Bottom shelf", "Anywhere"],
    "correctIndex": 2,
    "explanation": "Bottom shelf prevents drips from contaminating other foods."
  }
]',
'📝', ARRAY['safety', 'quiz'], 4
FROM learn_categories c WHERE c.name = 'Food Safety';

-- ============================================
-- STORAGE HACKS - Quick Tips (< 20 seconds each)
-- ============================================

INSERT INTO learn_lessons (category_id, title, type, duration, content, thumbnail, tags, sort_order)
SELECT c.id, 'Banana Hack 🍌', 'article', 1,
'**Bananas turning brown too fast?**

Wrap the stems in plastic wrap!

This slows the release of ethylene gas that causes ripening.

Works for 3-5 extra days. 🎉',
'🍌', ARRAY['storage', 'fruit'], 1
FROM learn_categories c WHERE c.name = 'Storage Hacks';

INSERT INTO learn_lessons (category_id, title, type, duration, content, thumbnail, tags, sort_order)
SELECT c.id, 'Herb Life Hack 🌿', 'article', 1,
'**Herbs wilting in a day?**

Treat them like flowers! 💐

Put stems in a glass of water, cover loosely with a bag, and refrigerate.

Fresh for up to **2 weeks**.',
'🌿', ARRAY['storage', 'herbs'], 2
FROM learn_categories c WHERE c.name = 'Storage Hacks';

INSERT INTO learn_lessons (category_id, title, type, duration, content, thumbnail, tags, sort_order)
SELECT c.id, 'Freezer Friend: Bread 🍞', 'article', 1,
'**Bread going stale?**

Freeze it! Sliced bread freezes perfectly.

Pop slices straight in the toaster - tastes freshly baked.

Lasts **3 months** in the freezer.',
'🍞', ARRAY['storage', 'freezer'], 3
FROM learn_categories c WHERE c.name = 'Storage Hacks';

INSERT INTO learn_lessons (category_id, title, type, duration, content, thumbnail, tags, sort_order)
SELECT c.id, 'The Cheese Secret 🧀', 'article', 1,
'**Cheese drying out?**

Wrap it in **parchment paper** first, then loosely in plastic.

The paper lets it breathe while the plastic keeps moisture in.

Fresh cheese for weeks!',
'🧀', ARRAY['storage', 'dairy'], 4
FROM learn_categories c WHERE c.name = 'Storage Hacks';

INSERT INTO learn_lessons (category_id, title, type, duration, content, thumbnail, tags, sort_order)
SELECT c.id, 'Storage Quiz 📦', 'quiz', 2,
'[
  {
    "question": "What helps bananas last longer?",
    "options": ["Refrigerate them", "Wrap stems in plastic", "Put in water", "Leave in sunlight"],
    "correctIndex": 1,
    "explanation": "Wrapping stems blocks ethylene gas that speeds ripening!"
  },
  {
    "question": "How should you store fresh herbs?",
    "options": ["In a plastic bag", "Stems in water like flowers", "Loose on the counter", "In the freezer"],
    "correctIndex": 1,
    "explanation": "Like flowers! They stay fresh for up to 2 weeks."
  },
  {
    "question": "Can you freeze sliced bread?",
    "options": ["No, it gets soggy", "Yes, for up to 3 months", "Only whole loaves", "Never freeze bread"],
    "correctIndex": 1,
    "explanation": "Sliced bread freezes great - toast straight from frozen!"
  }
]',
'📝', ARRAY['storage', 'quiz'], 5
FROM learn_categories c WHERE c.name = 'Storage Hacks';

-- ============================================
-- DONATION TIPS - Quick Tips (< 20 seconds each)
-- ============================================

INSERT INTO learn_lessons (category_id, title, type, duration, content, thumbnail, tags, cta_type, sort_order)
SELECT c.id, 'You''re Protected! ⚖️', 'article', 1,
'**Worried about donating food?**

The **Good Samaritan Act** protects you!

If you donate in good faith, you can''t be sued - even if someone gets sick.

So donate with confidence! 💪',
'⚖️', ARRAY['donation', 'legal'], 'donate', 1
FROM learn_categories c WHERE c.name = 'Donation Tips';

INSERT INTO learn_lessons (category_id, title, type, duration, content, thumbnail, tags, cta_type, sort_order)
SELECT c.id, 'What Food Banks Want 📦', 'article', 1,
'**Most needed items:**

✅ Peanut butter (protein!)
✅ Canned vegetables
✅ Pasta & rice
✅ Canned soups
✅ Baby food & formula

**Avoid:** opened items, expired food, or dented cans.',
'📦', ARRAY['donation', 'guidelines'], 'donate', 2
FROM learn_categories c WHERE c.name = 'Donation Tips';

INSERT INTO learn_lessons (category_id, title, type, duration, content, thumbnail, tags, sort_order)
SELECT c.id, '"Best By" ≠ Bad 📅', 'article', 1,
'**Past the "Best By" date?**

It might still be good!

- **Best By** = peak quality
- **Sell By** = store inventory
- **Use By** = safety date

Many foods are fine days or weeks past these dates.',
'📅', ARRAY['donation', 'dates'], 3
FROM learn_categories c WHERE c.name = 'Donation Tips';

INSERT INTO learn_lessons (category_id, title, type, duration, content, thumbnail, tags, sort_order)
SELECT c.id, 'Donation Quiz 🤝', 'quiz', 2,
'[
  {
    "question": "What protects food donors from lawsuits?",
    "options": ["Nothing", "Good Samaritan Act", "FDA Rules", "State laws only"],
    "correctIndex": 1,
    "explanation": "The Good Samaritan Act protects good-faith donors nationwide!"
  },
  {
    "question": "Which item do food banks need most?",
    "options": ["Bread", "Peanut butter", "Fresh salad", "Cookies"],
    "correctIndex": 1,
    "explanation": "Peanut butter is shelf-stable and packed with protein!"
  },
  {
    "question": "Is food past its ''Best By'' date always bad?",
    "options": ["Yes, always", "No, it''s about quality", "Only for cans", "Only for dairy"],
    "correctIndex": 1,
    "explanation": "''Best By'' indicates peak quality, not safety. Many foods are fine after!"
  }
]',
'📝', ARRAY['donation', 'quiz'], 4
FROM learn_categories c WHERE c.name = 'Donation Tips';

-- ============================================
-- COMPOST - Quick Tips (< 20 seconds each)
-- ============================================

INSERT INTO learn_lessons (category_id, title, type, duration, content, thumbnail, tags, sort_order)
SELECT c.id, 'Compost in 3 Words 🌱', 'article', 1,
'**Greens + Browns + Water**

- 🥬 **Greens** = food scraps, grass
- 🍂 **Browns** = leaves, cardboard
- 💧 **Water** = keep it damp

That''s it! Nature does the rest.',
'🌱', ARRAY['compost', 'basics'], 1
FROM learn_categories c WHERE c.name = 'Compost';

INSERT INTO learn_lessons (category_id, title, type, duration, content, thumbnail, tags, sort_order)
SELECT c.id, 'No Backyard? No Problem! 🏢', 'article', 1,
'**Apartment composting options:**

🪱 **Vermicompost** - worms do the work
🧪 **Bokashi bin** - ferments under your sink
📍 **Drop-off sites** - farmers markets, community gardens

Zero excuses! 😉',
'🏢', ARRAY['compost', 'apartment'], 2
FROM learn_categories c WHERE c.name = 'Compost';

INSERT INTO learn_lessons (category_id, title, type, duration, content, thumbnail, tags, sort_order)
SELECT c.id, 'Never Compost This ⛔', 'article', 1,
'**Keep out of your compost:**

❌ Meat & bones
❌ Dairy products
❌ Oils & fats
❌ Pet waste
❌ Diseased plants

These attract pests or create harmful bacteria.',
'⛔', ARRAY['compost', 'rules'], 3
FROM learn_categories c WHERE c.name = 'Compost';

INSERT INTO learn_lessons (category_id, title, type, duration, content, thumbnail, tags, sort_order)
SELECT c.id, 'Compost Quiz 🌿', 'quiz', 2,
'[
  {
    "question": "What are the 3 things compost needs?",
    "options": ["Sun, soil, seeds", "Greens, browns, water", "Meat, veggies, fruit", "Heat, cold, wind"],
    "correctIndex": 1,
    "explanation": "Greens (nitrogen) + Browns (carbon) + Water = perfect compost!"
  },
  {
    "question": "Can you compost in an apartment?",
    "options": ["No way", "Yes, with special methods", "Only on a balcony", "Only with a yard"],
    "correctIndex": 1,
    "explanation": "Vermicomposting and Bokashi bins work great indoors!"
  },
  {
    "question": "Which should NEVER go in compost?",
    "options": ["Coffee grounds", "Eggshells", "Meat scraps", "Banana peels"],
    "correctIndex": 2,
    "explanation": "Meat attracts pests and can create harmful bacteria."
  }
]',
'📝', ARRAY['compost', 'quiz'], 4
FROM learn_categories c WHERE c.name = 'Compost';

-- ============================================
-- PLANET FACTS - Mind-blowing stats (< 20 seconds each)
-- ============================================

INSERT INTO learn_lessons (category_id, title, type, duration, content, thumbnail, tags, sort_order)
SELECT c.id, '40% of Food = Trash 😱', 'article', 1,
'**In the US alone:**

Nearly **40%** of all food produced is thrown away.

That''s $408 billion wasted every year.

You can change this! Every meal saved matters. 🙌',
'😱', ARRAY['planet', 'stats'], 1
FROM learn_categories c WHERE c.name = 'Planet Facts';

INSERT INTO learn_lessons (category_id, title, type, duration, content, thumbnail, tags, sort_order)
SELECT c.id, 'Bigger Than China 🌏', 'article', 1,
'**Land used for wasted food:**

If we combined all farmland growing food that gets thrown away...

It would be **larger than China**. 🤯

That''s 30% of all agricultural land on Earth.',
'🌏', ARRAY['planet', 'land'], 2
FROM learn_categories c WHERE c.name = 'Planet Facts';

INSERT INTO learn_lessons (category_id, title, type, duration, content, thumbnail, tags, sort_order)
SELECT c.id, 'The Hidden Emissions 💨', 'article', 1,
'**Food waste = Climate change**

If food waste were a country, it would be the **3rd largest polluter**.

Only China and the US emit more greenhouse gases.

Your fridge is a climate tool! ♻️',
'💨', ARRAY['planet', 'emissions'], 3
FROM learn_categories c WHERE c.name = 'Planet Facts';

INSERT INTO learn_lessons (category_id, title, type, duration, content, thumbnail, tags, sort_order)
SELECT c.id, 'Water Down the Drain 💧', 'article', 1,
'**Wasting food = wasting water**

25% of all freshwater goes to grow food we throw away.

That''s enough to fill **100 million Olympic pools** yearly.

Save food, save water! 🏊‍♂️',
'💧', ARRAY['planet', 'water'], 4
FROM learn_categories c WHERE c.name = 'Planet Facts';

INSERT INTO learn_lessons (category_id, title, type, duration, content, thumbnail, tags, sort_order)
SELECT c.id, 'Planet Quiz 🌍', 'quiz', 2,
'[
  {
    "question": "What percentage of US food is wasted?",
    "options": ["10%", "25%", "40%", "60%"],
    "correctIndex": 2,
    "explanation": "Nearly 40% of all food in the US ends up in the trash!"
  },
  {
    "question": "If food waste were a country, how would it rank in emissions?",
    "options": ["#1", "#3", "#10", "#50"],
    "correctIndex": 1,
    "explanation": "Food waste would be the 3rd largest emitter after China and the US!"
  },
  {
    "question": "How much freshwater goes to growing wasted food?",
    "options": ["5%", "10%", "25%", "50%"],
    "correctIndex": 2,
    "explanation": "A quarter of all freshwater is used for food we never eat!"
  }
]',
'📝', ARRAY['planet', 'quiz'], 5
FROM learn_categories c WHERE c.name = 'Planet Facts';
