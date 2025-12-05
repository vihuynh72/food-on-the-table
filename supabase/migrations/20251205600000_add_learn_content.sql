-- Create categories
INSERT INTO public.learn_categories (id, name, description, icon, color, sort_order)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Food Safety', 'Learn how to handle and store food safely.', 'shield-check', 'woodland', 1),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Sustainable Living', 'Tips for a more eco-friendly lifestyle.', 'leaf', 'pine-glade', 2),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Community Impact', 'How you can make a difference.', 'users', 'raffia', 3)
ON CONFLICT (id) DO NOTHING;

-- Create lessons
INSERT INTO public.learn_lessons (id, category_id, title, type, duration, summary, content, thumbnail, tags, cta_type, cta_label, sort_order)
VALUES
    -- Food Safety Lesson (Article)
    (
        'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'The 2-Hour Rule',
        'article',
        15,
        'Never leave perishable food out for more than 2 hours.',
        '# The 2-Hour Rule\n\nDid you know?\n\n**Perishable food** should never be left out of refrigeration for more than **2 hours**.\n\nIf the temperature is above 90°F (32°C), food should not be left out for more than **1 hour**.\n\n*Keep it cool to keep it safe!*',
        'https://images.unsplash.com/photo-1584473457406-6240486418e9?auto=format&fit=crop&q=80&w=800',
        ARRAY['safety', 'storage', 'tips'],
        'triage',
        'Check Your Food',
        1
    ),
    -- Sustainable Living (Quiz)
    (
        'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
        'Recycling Basics',
        'quiz',
        20,
        'Test your knowledge on what can be recycled.',
        '[
            {
                "question": "Which of these items is typically NOT recyclable in curbside bins?",
                "options": ["Plastic Bottles", "Cardboard Boxes", "Plastic Bags", "Aluminum Cans"],
                "correctIndex": 2,
                "explanation": "Plastic bags can get tangled in sorting machinery. They should be taken to store drop-off locations."
            },
            {
                "question": "Should you wash food containers before recycling?",
                "options": ["No, it saves water", "Yes, they should be clean and dry", "Only if they are glass", "It does not matter"],
                "correctIndex": 1,
                "explanation": "Food residue can contaminate other recyclables. A quick rinse is usually sufficient."
            }
        ]',
        'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=800',
        ARRAY['recycling', 'environment', 'quiz'],
        'community',
        'Join Discussion',
        2
    ),
    -- Community Impact (Article)
    (
        'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16',
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
        'The Power of Sharing',
        'article',
        15,
        'Sharing food reduces waste and strengthens community bonds.',
        '# Why Share?\n\nSharing surplus food isn''t just about feeding others—it''s about:\n\n1.  **Reducing Waste**: Keeping good food out of landfills.\n2.  **Building Trust**: Connecting with neighbors.\n3.  **Saving Resources**: Water, energy, and labor used to produce food.\n\n*One small act of sharing can start a ripple of kindness.*',
        'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=800',
        ARRAY['community', 'sharing', 'impact'],
        'donate',
        'Share Food Now',
        3
    )
ON CONFLICT (id) DO NOTHING;
