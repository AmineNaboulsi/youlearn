-- ---------------------------------------------------------------------------
-- Open courseware seed — mathematics, physics and philosophy.
--
-- Every course, section and lesson title here was taken from the publisher's
-- own course page. Nothing is invented, and no lecture text is reproduced:
-- each lesson carries a short note and a link out to the source, which is
-- where the video actually lives and stays.
--
-- Sources and licences
--   MIT OpenCourseWare   CC BY-NC-SA 4.0   https://ocw.mit.edu/
--   Open Yale Courses    CC BY-NC-SA 3.0   https://oyc.yale.edu/
--
-- Both licences are NonCommercial. Courses are seeded at price 0.00 and must
-- stay free to remain within them.
--
-- Courses are authored by a curator account rather than by accounts named
-- after the real lecturers: inventing a login for Gilbert Strang would put
-- words in a real person's mouth. Attribution is carried in the course body
-- and on every lesson instead.
--
-- Re-runnable: every insert is keyed on a unique slug or email, so applying
-- this twice changes nothing the second time.
-- ---------------------------------------------------------------------------

SET NAMES utf8mb4;

USE youlearn;

-- --------------------------------------------------------------------------
-- Curator account, categories and tags
-- --------------------------------------------------------------------------
INSERT IGNORE INTO users (keycloak_id, name, email, role, is_active) VALUES
  ('44444444-4444-4444-8444-444444444444', 'YouLearn Open Library', 'library@youlearn.local', 'enseignant', 1);

INSERT IGNORE INTO categories (name, slug) VALUES
  ('Mathematics', 'mathematics'),
  ('Physics', 'physics'),
  ('Philosophy', 'philosophy');

INSERT IGNORE INTO tags (title, slug) VALUES
  ('Linear Algebra', 'linear-algebra'),
  ('Calculus', 'calculus'),
  ('Classical Mechanics', 'classical-mechanics'),
  ('Metaphysics', 'metaphysics'),
  ('Ethics', 'ethics'),
  ('Cognitive Science', 'cognitive-science'),
  ('MIT OpenCourseWare', 'mit-opencourseware'),
  ('Open Yale Courses', 'open-yale-courses'),
  ('Undergraduate', 'undergraduate'),
  ('Lecture Series', 'lecture-series');

-- --------------------------------------------------------------------------
-- Linear Algebra (MIT 18.06)
-- MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010
-- --------------------------------------------------------------------------
INSERT IGNORE INTO courses
  (instructor_id, category_id, title, slug, subtitle, img, description,
   content_type, content, price, is_published)
SELECT u.id, c.id, 'Linear Algebra (MIT 18.06)', 'mit-18-06-linear-algebra', 'Gilbert Strang''s complete course — elimination, subspaces, eigenvalues and the SVD', 'https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?auto=format&fit=crop&w=1200&q=80',
       'The linear algebra course that taught a generation of engineers. Prof. Gilbert Strang starts from a system of two equations in two unknowns and builds, lecture by lecture, to the singular value decomposition — always asking what a matrix is doing geometrically before asking how to compute with it.

Thirty-five recorded lectures from MIT, complete with the quiz reviews. Free to watch; the lecture videos stay on MIT OpenCourseWare and open in a new tab.',
       'text', 'The linear algebra course that taught a generation of engineers. Prof. Gilbert Strang starts from a system of two equations in two unknowns and builds, lecture by lecture, to the singular value decomposition — always asking what a matrix is doing geometrically before asking how to compute with it.

Thirty-five recorded lectures from MIT, complete with the quiz reviews. Free to watch; the lecture videos stay on MIT OpenCourseWare and open in a new tab.

Source: MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010
Taught by: Prof. Gilbert Strang (MIT)
Licence: CC BY-NC-SA 4.0
Course home: https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/
Video playlist: https://www.youtube.com/playlist?list=PLE7DDD91010BC51F8', 0.00, 1
  FROM users u, categories c
 WHERE u.email = 'library@youlearn.local' AND c.slug = 'mathematics';

INSERT IGNORE INTO course_tags (course_id, tag_id)
SELECT co.id, t.id FROM courses co, tags t
 WHERE co.slug = 'mit-18-06-linear-algebra' AND t.slug = 'linear-algebra';
INSERT IGNORE INTO course_tags (course_id, tag_id)
SELECT co.id, t.id FROM courses co, tags t
 WHERE co.slug = 'mit-18-06-linear-algebra' AND t.slug = 'mit-opencourseware';
INSERT IGNORE INTO course_tags (course_id, tag_id)
SELECT co.id, t.id FROM courses co, tags t
 WHERE co.slug = 'mit-18-06-linear-algebra' AND t.slug = 'undergraduate';
INSERT IGNORE INTO course_tags (course_id, tag_id)
SELECT co.id, t.id FROM courses co, tags t
 WHERE co.slug = 'mit-18-06-linear-algebra' AND t.slug = 'lecture-series';

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'Elimination and matrices', 'Solving a linear system by elimination, and the matrix factorisations that record what elimination did.', 0 FROM courses co WHERE co.slug = 'mit-18-06-linear-algebra'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'Elimination and matrices'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 1. The geometry of linear equations', 'Source: MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010', 'text', 'Part of MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010.

Watch: https://www.youtube.com/playlist?list=PLE7DDD91010BC51F8', 0, 1, 0
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-06-linear-algebra' AND s.title = 'Elimination and matrices'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 1. The geometry of linear equations');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 2. Elimination with matrices', 'Source: MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010', 'text', 'Part of MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010.

Watch: https://www.youtube.com/playlist?list=PLE7DDD91010BC51F8', 0, 0, 1
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-06-linear-algebra' AND s.title = 'Elimination and matrices'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 2. Elimination with matrices');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 3. Multiplication and inverse matrices', 'Source: MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010', 'text', 'Part of MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010.

Watch: https://www.youtube.com/playlist?list=PLE7DDD91010BC51F8', 0, 0, 2
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-06-linear-algebra' AND s.title = 'Elimination and matrices'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 3. Multiplication and inverse matrices');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 4. Factorization into A = LU', 'Source: MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010', 'text', 'Part of MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010.

Watch: https://www.youtube.com/playlist?list=PLE7DDD91010BC51F8', 0, 0, 3
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-06-linear-algebra' AND s.title = 'Elimination and matrices'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 4. Factorization into A = LU');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 5. Transposes, permutations, spaces R^n', 'Source: MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010', 'text', 'Part of MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010.

Watch: https://www.youtube.com/playlist?list=PLE7DDD91010BC51F8', 0, 0, 4
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-06-linear-algebra' AND s.title = 'Elimination and matrices'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 5. Transposes, permutations, spaces R^n');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 6. Column space and nullspace', 'Source: MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010', 'text', 'Part of MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010.

Watch: https://www.youtube.com/playlist?list=PLE7DDD91010BC51F8', 0, 0, 5
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-06-linear-algebra' AND s.title = 'Elimination and matrices'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 6. Column space and nullspace');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 7. Solving Ax = 0: pivot variables, special solutions', 'Source: MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010', 'text', 'Part of MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010.

Watch: https://www.youtube.com/playlist?list=PLE7DDD91010BC51F8', 0, 0, 6
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-06-linear-algebra' AND s.title = 'Elimination and matrices'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 7. Solving Ax = 0: pivot variables, special solutions');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 8. Solving Ax = b: row reduced form R', 'Source: MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010', 'text', 'Part of MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010.

Watch: https://www.youtube.com/playlist?list=PLE7DDD91010BC51F8', 0, 0, 7
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-06-linear-algebra' AND s.title = 'Elimination and matrices'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 8. Solving Ax = b: row reduced form R');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'Vector spaces and subspaces', 'The four fundamental subspaces, and what independence, basis and dimension actually mean.', 1 FROM courses co WHERE co.slug = 'mit-18-06-linear-algebra'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'Vector spaces and subspaces'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 9. Independence, basis, and dimension', 'Source: MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010', 'text', 'Part of MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010.

Watch: https://www.youtube.com/playlist?list=PLE7DDD91010BC51F8', 0, 0, 8
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-06-linear-algebra' AND s.title = 'Vector spaces and subspaces'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 9. Independence, basis, and dimension');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 10. The four fundamental subspaces', 'Source: MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010', 'text', 'Part of MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010.

Watch: https://www.youtube.com/playlist?list=PLE7DDD91010BC51F8', 0, 0, 9
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-06-linear-algebra' AND s.title = 'Vector spaces and subspaces'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 10. The four fundamental subspaces');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 11. Matrix spaces; rank 1; small world graphs', 'Source: MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010', 'text', 'Part of MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010.

Watch: https://www.youtube.com/playlist?list=PLE7DDD91010BC51F8', 0, 0, 10
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-06-linear-algebra' AND s.title = 'Vector spaces and subspaces'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 11. Matrix spaces; rank 1; small world graphs');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 12. Graphs, networks, incidence matrices', 'Source: MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010', 'text', 'Part of MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010.

Watch: https://www.youtube.com/playlist?list=PLE7DDD91010BC51F8', 0, 0, 11
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-06-linear-algebra' AND s.title = 'Vector spaces and subspaces'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 12. Graphs, networks, incidence matrices');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 13. Quiz 1 review', 'Source: MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010', 'text', 'Part of MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010.

Watch: https://www.youtube.com/playlist?list=PLE7DDD91010BC51F8', 0, 0, 12
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-06-linear-algebra' AND s.title = 'Vector spaces and subspaces'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 13. Quiz 1 review');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'Orthogonality', 'Projection, least squares and Gram-Schmidt — the geometry behind fitting a line to data.', 2 FROM courses co WHERE co.slug = 'mit-18-06-linear-algebra'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'Orthogonality'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 14. Orthogonal vectors and subspaces', 'Source: MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010', 'text', 'Part of MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010.

Watch: https://www.youtube.com/playlist?list=PLE7DDD91010BC51F8', 0, 0, 13
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-06-linear-algebra' AND s.title = 'Orthogonality'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 14. Orthogonal vectors and subspaces');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 15. Projections onto subspaces', 'Source: MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010', 'text', 'Part of MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010.

Watch: https://www.youtube.com/playlist?list=PLE7DDD91010BC51F8', 0, 0, 14
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-06-linear-algebra' AND s.title = 'Orthogonality'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 15. Projections onto subspaces');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 16. Projection matrices and least squares', 'Source: MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010', 'text', 'Part of MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010.

Watch: https://www.youtube.com/playlist?list=PLE7DDD91010BC51F8', 0, 0, 15
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-06-linear-algebra' AND s.title = 'Orthogonality'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 16. Projection matrices and least squares');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 17. Orthogonal matrices and Gram-Schmidt', 'Source: MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010', 'text', 'Part of MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010.

Watch: https://www.youtube.com/playlist?list=PLE7DDD91010BC51F8', 0, 0, 16
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-06-linear-algebra' AND s.title = 'Orthogonality'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 17. Orthogonal matrices and Gram-Schmidt');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'Determinants', 'Three properties that define the determinant, and the formulas that follow from them.', 3 FROM courses co WHERE co.slug = 'mit-18-06-linear-algebra'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'Determinants'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 18. Properties of determinants', 'Source: MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010', 'text', 'Part of MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010.

Watch: https://www.youtube.com/playlist?list=PLE7DDD91010BC51F8', 0, 0, 17
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-06-linear-algebra' AND s.title = 'Determinants'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 18. Properties of determinants');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 19. Determinant formulas and cofactors', 'Source: MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010', 'text', 'Part of MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010.

Watch: https://www.youtube.com/playlist?list=PLE7DDD91010BC51F8', 0, 0, 18
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-06-linear-algebra' AND s.title = 'Determinants'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 19. Determinant formulas and cofactors');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 20. Cramer''s rule, inverse matrix, and volume', 'Source: MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010', 'text', 'Part of MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010.

Watch: https://www.youtube.com/playlist?list=PLE7DDD91010BC51F8', 0, 0, 19
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-06-linear-algebra' AND s.title = 'Determinants'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 20. Cramer''s rule, inverse matrix, and volume');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'Eigenvalues and eigenvectors', 'Diagonalisation, powers of a matrix, differential equations and Markov chains.', 4 FROM courses co WHERE co.slug = 'mit-18-06-linear-algebra'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'Eigenvalues and eigenvectors'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 21. Eigenvalues and eigenvectors', 'Source: MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010', 'text', 'Part of MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010.

Watch: https://www.youtube.com/playlist?list=PLE7DDD91010BC51F8', 0, 0, 20
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-06-linear-algebra' AND s.title = 'Eigenvalues and eigenvectors'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 21. Eigenvalues and eigenvectors');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 22. Diagonalization and powers of A', 'Source: MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010', 'text', 'Part of MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010.

Watch: https://www.youtube.com/playlist?list=PLE7DDD91010BC51F8', 0, 0, 21
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-06-linear-algebra' AND s.title = 'Eigenvalues and eigenvectors'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 22. Diagonalization and powers of A');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 23. Differential equations and exp(At)', 'Source: MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010', 'text', 'Part of MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010.

Watch: https://www.youtube.com/playlist?list=PLE7DDD91010BC51F8', 0, 0, 22
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-06-linear-algebra' AND s.title = 'Eigenvalues and eigenvectors'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 23. Differential equations and exp(At)');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 24. Markov matrices; Fourier series', 'Source: MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010', 'text', 'Part of MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010.

Watch: https://www.youtube.com/playlist?list=PLE7DDD91010BC51F8', 0, 0, 23
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-06-linear-algebra' AND s.title = 'Eigenvalues and eigenvectors'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 24. Markov matrices; Fourier series');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 25. Quiz 2 review', 'Source: MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010', 'text', 'Part of MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010.

Watch: https://www.youtube.com/playlist?list=PLE7DDD91010BC51F8', 0, 0, 24
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-06-linear-algebra' AND s.title = 'Eigenvalues and eigenvectors'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 25. Quiz 2 review');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'Symmetric and positive definite matrices', 'The best-behaved matrices there are, plus complex matrices and the FFT.', 5 FROM courses co WHERE co.slug = 'mit-18-06-linear-algebra'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'Symmetric and positive definite matrices'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 26. Symmetric matrices and positive definiteness', 'Source: MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010', 'text', 'Part of MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010.

Watch: https://www.youtube.com/playlist?list=PLE7DDD91010BC51F8', 0, 0, 25
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-06-linear-algebra' AND s.title = 'Symmetric and positive definite matrices'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 26. Symmetric matrices and positive definiteness');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 27. Complex matrices; fast Fourier transform', 'Source: MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010', 'text', 'Part of MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010.

Watch: https://www.youtube.com/playlist?list=PLE7DDD91010BC51F8', 0, 0, 26
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-06-linear-algebra' AND s.title = 'Symmetric and positive definite matrices'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 27. Complex matrices; fast Fourier transform');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 28. Positive definite matrices and minima', 'Source: MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010', 'text', 'Part of MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010.

Watch: https://www.youtube.com/playlist?list=PLE7DDD91010BC51F8', 0, 0, 27
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-06-linear-algebra' AND s.title = 'Symmetric and positive definite matrices'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 28. Positive definite matrices and minima');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 29. Similar matrices and Jordan form', 'Source: MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010', 'text', 'Part of MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010.

Watch: https://www.youtube.com/playlist?list=PLE7DDD91010BC51F8', 0, 0, 28
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-06-linear-algebra' AND s.title = 'Symmetric and positive definite matrices'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 29. Similar matrices and Jordan form');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'The SVD and linear transformations', 'Singular value decomposition, change of basis, and the pseudoinverse.', 6 FROM courses co WHERE co.slug = 'mit-18-06-linear-algebra'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'The SVD and linear transformations'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 30. Singular value decomposition', 'Source: MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010', 'text', 'Part of MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010.

Watch: https://www.youtube.com/playlist?list=PLE7DDD91010BC51F8', 0, 0, 29
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-06-linear-algebra' AND s.title = 'The SVD and linear transformations'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 30. Singular value decomposition');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 31. Linear transformations and their matrices', 'Source: MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010', 'text', 'Part of MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010.

Watch: https://www.youtube.com/playlist?list=PLE7DDD91010BC51F8', 0, 0, 30
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-06-linear-algebra' AND s.title = 'The SVD and linear transformations'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 31. Linear transformations and their matrices');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 32. Change of basis; image compression', 'Source: MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010', 'text', 'Part of MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010.

Watch: https://www.youtube.com/playlist?list=PLE7DDD91010BC51F8', 0, 0, 31
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-06-linear-algebra' AND s.title = 'The SVD and linear transformations'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 32. Change of basis; image compression');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 33. Quiz 3 review', 'Source: MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010', 'text', 'Part of MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010.

Watch: https://www.youtube.com/playlist?list=PLE7DDD91010BC51F8', 0, 0, 32
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-06-linear-algebra' AND s.title = 'The SVD and linear transformations'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 33. Quiz 3 review');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 34. Left and right inverses; pseudoinverse', 'Source: MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010', 'text', 'Part of MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010.

Watch: https://www.youtube.com/playlist?list=PLE7DDD91010BC51F8', 0, 0, 33
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-06-linear-algebra' AND s.title = 'The SVD and linear transformations'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 34. Left and right inverses; pseudoinverse');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 35. Final course review', 'Source: MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010', 'text', 'Part of MIT OpenCourseWare — 18.06 Linear Algebra, Spring 2010.

Watch: https://www.youtube.com/playlist?list=PLE7DDD91010BC51F8', 0, 0, 34
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-06-linear-algebra' AND s.title = 'The SVD and linear transformations'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 35. Final course review');

-- --------------------------------------------------------------------------
-- Classical Mechanics (MIT 8.01)
-- MIT OpenCourseWare — 8.01SC Classical Mechanics, Fall 2016
-- --------------------------------------------------------------------------
INSERT IGNORE INTO courses
  (instructor_id, category_id, title, slug, subtitle, img, description,
   content_type, content, price, is_published)
SELECT u.id, c.id, 'Classical Mechanics (MIT 8.01)', 'mit-8-01-classical-mechanics', 'MIT''s first physics course — kinematics, Newton''s laws, energy and rotation', 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=1200&q=80',
       'The first course in the MIT physics curriculum, taught over twelve weeks. It begins with how motion is described and ends with rolling bodies and angular momentum, taking in drag, collisions and energy conservation on the way.

Each week groups three or four short topic videos rather than one long lecture, which makes it unusually easy to pick up and put down.',
       'text', 'The first course in the MIT physics curriculum, taught over twelve weeks. It begins with how motion is described and ends with rolling bodies and angular momentum, taking in drag, collisions and energy conservation on the way.

Each week groups three or four short topic videos rather than one long lecture, which makes it unusually easy to pick up and put down.

Source: MIT OpenCourseWare — 8.01SC Classical Mechanics, Fall 2016
Taught by: Dr. Peter Dourmashkin, Dr. Michelle Tomasik, Prof. Deepto Chakrabarty, Prof. Anna Frebel and Prof. Vladan Vuletic (MIT)
Licence: CC BY-NC-SA 4.0
Course home: https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/
Video playlist: https://www.youtube.com/playlist?list=PLUl4u3cNGP61qDex7XslwNJ-xxxEFzMNV', 0.00, 1
  FROM users u, categories c
 WHERE u.email = 'library@youlearn.local' AND c.slug = 'physics';

INSERT IGNORE INTO course_tags (course_id, tag_id)
SELECT co.id, t.id FROM courses co, tags t
 WHERE co.slug = 'mit-8-01-classical-mechanics' AND t.slug = 'classical-mechanics';
INSERT IGNORE INTO course_tags (course_id, tag_id)
SELECT co.id, t.id FROM courses co, tags t
 WHERE co.slug = 'mit-8-01-classical-mechanics' AND t.slug = 'mit-opencourseware';
INSERT IGNORE INTO course_tags (course_id, tag_id)
SELECT co.id, t.id FROM courses co, tags t
 WHERE co.slug = 'mit-8-01-classical-mechanics' AND t.slug = 'undergraduate';
INSERT IGNORE INTO course_tags (course_id, tag_id)
SELECT co.id, t.id FROM courses co, tags t
 WHERE co.slug = 'mit-8-01-classical-mechanics' AND t.slug = 'lecture-series';

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'Motion and Newton''s laws', 'How motion is described, and the three laws that explain it.', 0 FROM courses co WHERE co.slug = 'mit-8-01-classical-mechanics'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'Motion and Newton''s laws'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Week 1. Kinematics', 'Source: MIT OpenCourseWare — 8.01SC Classical Mechanics, Fall 2016', 'text', 'Part of MIT OpenCourseWare — 8.01SC Classical Mechanics, Fall 2016.

Watch: https://www.youtube.com/playlist?list=PLUl4u3cNGP61qDex7XslwNJ-xxxEFzMNV', 0, 1, 0
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-8-01-classical-mechanics' AND s.title = 'Motion and Newton''s laws'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Week 1. Kinematics');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Week 2. Newton''s Laws', 'Source: MIT OpenCourseWare — 8.01SC Classical Mechanics, Fall 2016', 'text', 'Part of MIT OpenCourseWare — 8.01SC Classical Mechanics, Fall 2016.

Watch: https://www.youtube.com/playlist?list=PLUl4u3cNGP61qDex7XslwNJ-xxxEFzMNV', 0, 0, 1
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-8-01-classical-mechanics' AND s.title = 'Motion and Newton''s laws'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Week 2. Newton''s Laws');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Week 3. Circular Motion', 'Source: MIT OpenCourseWare — 8.01SC Classical Mechanics, Fall 2016', 'text', 'Part of MIT OpenCourseWare — 8.01SC Classical Mechanics, Fall 2016.

Watch: https://www.youtube.com/playlist?list=PLUl4u3cNGP61qDex7XslwNJ-xxxEFzMNV', 0, 0, 2
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-8-01-classical-mechanics' AND s.title = 'Motion and Newton''s laws'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Week 3. Circular Motion');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'Forces, constraints and momentum', 'Drag, constraint forces, and momentum as the quantity that survives a collision.', 1 FROM courses co WHERE co.slug = 'mit-8-01-classical-mechanics'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'Forces, constraints and momentum'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Week 4. Drag Forces, Constraints and Continuous Systems', 'Source: MIT OpenCourseWare — 8.01SC Classical Mechanics, Fall 2016', 'text', 'Part of MIT OpenCourseWare — 8.01SC Classical Mechanics, Fall 2016.

Watch: https://www.youtube.com/playlist?list=PLUl4u3cNGP61qDex7XslwNJ-xxxEFzMNV', 0, 0, 3
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-8-01-classical-mechanics' AND s.title = 'Forces, constraints and momentum'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Week 4. Drag Forces, Constraints and Continuous Systems');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Week 5. Momentum and Impulse', 'Source: MIT OpenCourseWare — 8.01SC Classical Mechanics, Fall 2016', 'text', 'Part of MIT OpenCourseWare — 8.01SC Classical Mechanics, Fall 2016.

Watch: https://www.youtube.com/playlist?list=PLUl4u3cNGP61qDex7XslwNJ-xxxEFzMNV', 0, 0, 4
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-8-01-classical-mechanics' AND s.title = 'Forces, constraints and momentum'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Week 5. Momentum and Impulse');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Week 6. Continuous Mass Transfer', 'Source: MIT OpenCourseWare — 8.01SC Classical Mechanics, Fall 2016', 'text', 'Part of MIT OpenCourseWare — 8.01SC Classical Mechanics, Fall 2016.

Watch: https://www.youtube.com/playlist?list=PLUl4u3cNGP61qDex7XslwNJ-xxxEFzMNV', 0, 0, 5
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-8-01-classical-mechanics' AND s.title = 'Forces, constraints and momentum'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Week 6. Continuous Mass Transfer');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'Energy', 'Work, kinetic and potential energy, conservation, and what happens when things collide.', 2 FROM courses co WHERE co.slug = 'mit-8-01-classical-mechanics'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'Energy'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Week 7. Kinetic Energy and Work', 'Source: MIT OpenCourseWare — 8.01SC Classical Mechanics, Fall 2016', 'text', 'Part of MIT OpenCourseWare — 8.01SC Classical Mechanics, Fall 2016.

Watch: https://www.youtube.com/playlist?list=PLUl4u3cNGP61qDex7XslwNJ-xxxEFzMNV', 0, 0, 6
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-8-01-classical-mechanics' AND s.title = 'Energy'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Week 7. Kinetic Energy and Work');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Week 8. Potential Energy and Energy Conservation', 'Source: MIT OpenCourseWare — 8.01SC Classical Mechanics, Fall 2016', 'text', 'Part of MIT OpenCourseWare — 8.01SC Classical Mechanics, Fall 2016.

Watch: https://www.youtube.com/playlist?list=PLUl4u3cNGP61qDex7XslwNJ-xxxEFzMNV', 0, 0, 7
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-8-01-classical-mechanics' AND s.title = 'Energy'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Week 8. Potential Energy and Energy Conservation');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Week 9. Collision Theory', 'Source: MIT OpenCourseWare — 8.01SC Classical Mechanics, Fall 2016', 'text', 'Part of MIT OpenCourseWare — 8.01SC Classical Mechanics, Fall 2016.

Watch: https://www.youtube.com/playlist?list=PLUl4u3cNGP61qDex7XslwNJ-xxxEFzMNV', 0, 0, 8
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-8-01-classical-mechanics' AND s.title = 'Energy'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Week 9. Collision Theory');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'Rotation', 'Rotational motion, angular momentum, and rolling as translation plus rotation.', 3 FROM courses co WHERE co.slug = 'mit-8-01-classical-mechanics'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'Rotation'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Week 10. Rotational Motion', 'Source: MIT OpenCourseWare — 8.01SC Classical Mechanics, Fall 2016', 'text', 'Part of MIT OpenCourseWare — 8.01SC Classical Mechanics, Fall 2016.

Watch: https://www.youtube.com/playlist?list=PLUl4u3cNGP61qDex7XslwNJ-xxxEFzMNV', 0, 0, 9
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-8-01-classical-mechanics' AND s.title = 'Rotation'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Week 10. Rotational Motion');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Week 11. Angular Momentum', 'Source: MIT OpenCourseWare — 8.01SC Classical Mechanics, Fall 2016', 'text', 'Part of MIT OpenCourseWare — 8.01SC Classical Mechanics, Fall 2016.

Watch: https://www.youtube.com/playlist?list=PLUl4u3cNGP61qDex7XslwNJ-xxxEFzMNV', 0, 0, 10
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-8-01-classical-mechanics' AND s.title = 'Rotation'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Week 11. Angular Momentum');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Week 12. Rotations and Translation — Rolling', 'Source: MIT OpenCourseWare — 8.01SC Classical Mechanics, Fall 2016', 'text', 'Part of MIT OpenCourseWare — 8.01SC Classical Mechanics, Fall 2016.

Watch: https://www.youtube.com/playlist?list=PLUl4u3cNGP61qDex7XslwNJ-xxxEFzMNV', 0, 0, 11
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-8-01-classical-mechanics' AND s.title = 'Rotation'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Week 12. Rotations and Translation — Rolling');

-- --------------------------------------------------------------------------
-- Single Variable Calculus (MIT 18.01)
-- MIT OpenCourseWare — 18.01SC Single Variable Calculus, Fall 2010
-- --------------------------------------------------------------------------
INSERT IGNORE INTO courses
  (instructor_id, category_id, title, slug, subtitle, img, description,
   content_type, content, price, is_published)
SELECT u.id, c.id, 'Single Variable Calculus (MIT 18.01)', 'mit-18-01-single-variable-calculus', 'Differentiation, integration and infinite series, from first principles', 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80',
       'Differentiation and integration of functions of one variable, closing with a look at infinite series. The emphasis throughout is on applying the machinery — to physics, to engineering, to economics — rather than on manipulating symbols for their own sake.

Organised as five units, each with its own problem sets and exams on MIT OpenCourseWare.',
       'text', 'Differentiation and integration of functions of one variable, closing with a look at infinite series. The emphasis throughout is on applying the machinery — to physics, to engineering, to economics — rather than on manipulating symbols for their own sake.

Organised as five units, each with its own problem sets and exams on MIT OpenCourseWare.

Source: MIT OpenCourseWare — 18.01SC Single Variable Calculus, Fall 2010
Taught by: Prof. David Jerison (MIT)
Licence: CC BY-NC-SA 4.0
Course home: https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/', 0.00, 1
  FROM users u, categories c
 WHERE u.email = 'library@youlearn.local' AND c.slug = 'mathematics';

INSERT IGNORE INTO course_tags (course_id, tag_id)
SELECT co.id, t.id FROM courses co, tags t
 WHERE co.slug = 'mit-18-01-single-variable-calculus' AND t.slug = 'calculus';
INSERT IGNORE INTO course_tags (course_id, tag_id)
SELECT co.id, t.id FROM courses co, tags t
 WHERE co.slug = 'mit-18-01-single-variable-calculus' AND t.slug = 'mit-opencourseware';
INSERT IGNORE INTO course_tags (course_id, tag_id)
SELECT co.id, t.id FROM courses co, tags t
 WHERE co.slug = 'mit-18-01-single-variable-calculus' AND t.slug = 'undergraduate';

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'Differentiation', NULL, 0 FROM courses co WHERE co.slug = 'mit-18-01-single-variable-calculus'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'Differentiation'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Part A — Definition and Basic Rules', 'Source: MIT OpenCourseWare — 18.01SC Single Variable Calculus, Fall 2010', 'text', 'Part of MIT OpenCourseWare — 18.01SC Single Variable Calculus, Fall 2010.

Watch: https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/', 0, 1, 0
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-01-single-variable-calculus' AND s.title = 'Differentiation'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Part A — Definition and Basic Rules');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Part B — Implicit Differentiation and Inverse Functions', 'Source: MIT OpenCourseWare — 18.01SC Single Variable Calculus, Fall 2010', 'text', 'Part of MIT OpenCourseWare — 18.01SC Single Variable Calculus, Fall 2010.

Watch: https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/', 0, 0, 1
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-01-single-variable-calculus' AND s.title = 'Differentiation'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Part B — Implicit Differentiation and Inverse Functions');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'Applications of Differentiation', NULL, 1 FROM courses co WHERE co.slug = 'mit-18-01-single-variable-calculus'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'Applications of Differentiation'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Part A — Approximation and Curve Sketching', 'Source: MIT OpenCourseWare — 18.01SC Single Variable Calculus, Fall 2010', 'text', 'Part of MIT OpenCourseWare — 18.01SC Single Variable Calculus, Fall 2010.

Watch: https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/', 0, 0, 2
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-01-single-variable-calculus' AND s.title = 'Applications of Differentiation'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Part A — Approximation and Curve Sketching');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Part B — Optimization, Related Rates and Newton''s Method', 'Source: MIT OpenCourseWare — 18.01SC Single Variable Calculus, Fall 2010', 'text', 'Part of MIT OpenCourseWare — 18.01SC Single Variable Calculus, Fall 2010.

Watch: https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/', 0, 0, 3
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-01-single-variable-calculus' AND s.title = 'Applications of Differentiation'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Part B — Optimization, Related Rates and Newton''s Method');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Part C — Mean Value Theorem, Antiderivatives and Differential Equations', 'Source: MIT OpenCourseWare — 18.01SC Single Variable Calculus, Fall 2010', 'text', 'Part of MIT OpenCourseWare — 18.01SC Single Variable Calculus, Fall 2010.

Watch: https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/', 0, 0, 4
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-01-single-variable-calculus' AND s.title = 'Applications of Differentiation'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Part C — Mean Value Theorem, Antiderivatives and Differential Equations');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'The Definite Integral and its Applications', NULL, 2 FROM courses co WHERE co.slug = 'mit-18-01-single-variable-calculus'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'The Definite Integral and its Applications'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Part A — Definition and the First Fundamental Theorem', 'Source: MIT OpenCourseWare — 18.01SC Single Variable Calculus, Fall 2010', 'text', 'Part of MIT OpenCourseWare — 18.01SC Single Variable Calculus, Fall 2010.

Watch: https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/', 0, 0, 5
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-01-single-variable-calculus' AND s.title = 'The Definite Integral and its Applications'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Part A — Definition and the First Fundamental Theorem');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Part B — Second Fundamental Theorem, Areas and Volumes', 'Source: MIT OpenCourseWare — 18.01SC Single Variable Calculus, Fall 2010', 'text', 'Part of MIT OpenCourseWare — 18.01SC Single Variable Calculus, Fall 2010.

Watch: https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/', 0, 0, 6
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-01-single-variable-calculus' AND s.title = 'The Definite Integral and its Applications'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Part B — Second Fundamental Theorem, Areas and Volumes');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Part C — Average Value, Probability and Numerical Integration', 'Source: MIT OpenCourseWare — 18.01SC Single Variable Calculus, Fall 2010', 'text', 'Part of MIT OpenCourseWare — 18.01SC Single Variable Calculus, Fall 2010.

Watch: https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/', 0, 0, 7
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-01-single-variable-calculus' AND s.title = 'The Definite Integral and its Applications'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Part C — Average Value, Probability and Numerical Integration');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'Techniques of Integration', NULL, 3 FROM courses co WHERE co.slug = 'mit-18-01-single-variable-calculus'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'Techniques of Integration'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Part A — Trigonometric Powers and Substitution', 'Source: MIT OpenCourseWare — 18.01SC Single Variable Calculus, Fall 2010', 'text', 'Part of MIT OpenCourseWare — 18.01SC Single Variable Calculus, Fall 2010.

Watch: https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/', 0, 0, 8
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-01-single-variable-calculus' AND s.title = 'Techniques of Integration'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Part A — Trigonometric Powers and Substitution');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Part B — Partial Fractions, Integration by Parts and Arc Length', 'Source: MIT OpenCourseWare — 18.01SC Single Variable Calculus, Fall 2010', 'text', 'Part of MIT OpenCourseWare — 18.01SC Single Variable Calculus, Fall 2010.

Watch: https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/', 0, 0, 9
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-01-single-variable-calculus' AND s.title = 'Techniques of Integration'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Part B — Partial Fractions, Integration by Parts and Arc Length');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Part C — Parametric Equations and Polar Coordinates', 'Source: MIT OpenCourseWare — 18.01SC Single Variable Calculus, Fall 2010', 'text', 'Part of MIT OpenCourseWare — 18.01SC Single Variable Calculus, Fall 2010.

Watch: https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/', 0, 0, 10
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-01-single-variable-calculus' AND s.title = 'Techniques of Integration'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Part C — Parametric Equations and Polar Coordinates');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'Exploring the Infinite', NULL, 4 FROM courses co WHERE co.slug = 'mit-18-01-single-variable-calculus'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'Exploring the Infinite'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Part A — L''Hospital''s Rule and Improper Integrals', 'Source: MIT OpenCourseWare — 18.01SC Single Variable Calculus, Fall 2010', 'text', 'Part of MIT OpenCourseWare — 18.01SC Single Variable Calculus, Fall 2010.

Watch: https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/', 0, 0, 11
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-01-single-variable-calculus' AND s.title = 'Exploring the Infinite'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Part A — L''Hospital''s Rule and Improper Integrals');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Part B — Taylor Series', 'Source: MIT OpenCourseWare — 18.01SC Single Variable Calculus, Fall 2010', 'text', 'Part of MIT OpenCourseWare — 18.01SC Single Variable Calculus, Fall 2010.

Watch: https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/', 0, 0, 12
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'mit-18-01-single-variable-calculus' AND s.title = 'Exploring the Infinite'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Part B — Taylor Series');

-- --------------------------------------------------------------------------
-- Death (Yale PHIL 176)
-- Open Yale Courses — PHIL 176: Death, Spring 2007
-- --------------------------------------------------------------------------
INSERT IGNORE INTO courses
  (instructor_id, category_id, title, slug, subtitle, img, description,
   content_type, content, price, is_published)
SELECT u.id, c.id, 'Death (Yale PHIL 176)', 'yale-phil-176-death', 'Shelly Kagan on mortality, personal identity and whether death is bad for us', 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&q=80',
       'One of the most-watched philosophy courses ever recorded. Prof. Shelly Kagan asks what a person is, whether anything survives the body, and — if nothing does — in what sense death can be bad for the one who dies.

Twenty-six lectures, argued rather than surveyed: Kagan takes positions and defends them, and the course is a lesson in how to argue as much as it is about its subject.

Later lectures examine the philosophical literature on the rationality and morality of suicide as an academic question.',
       'text', 'One of the most-watched philosophy courses ever recorded. Prof. Shelly Kagan asks what a person is, whether anything survives the body, and — if nothing does — in what sense death can be bad for the one who dies.

Twenty-six lectures, argued rather than surveyed: Kagan takes positions and defends them, and the course is a lesson in how to argue as much as it is about its subject.

Later lectures examine the philosophical literature on the rationality and morality of suicide as an academic question.

Source: Open Yale Courses — PHIL 176: Death, Spring 2007
Taught by: Prof. Shelly Kagan (Yale)
Licence: CC BY-NC-SA 3.0
Course home: https://oyc.yale.edu/death/phil-176
Video playlist: https://www.youtube.com/playlist?list=PLEA18FAF1AD9047B0', 0.00, 1
  FROM users u, categories c
 WHERE u.email = 'library@youlearn.local' AND c.slug = 'philosophy';

INSERT IGNORE INTO course_tags (course_id, tag_id)
SELECT co.id, t.id FROM courses co, tags t
 WHERE co.slug = 'yale-phil-176-death' AND t.slug = 'metaphysics';
INSERT IGNORE INTO course_tags (course_id, tag_id)
SELECT co.id, t.id FROM courses co, tags t
 WHERE co.slug = 'yale-phil-176-death' AND t.slug = 'open-yale-courses';
INSERT IGNORE INTO course_tags (course_id, tag_id)
SELECT co.id, t.id FROM courses co, tags t
 WHERE co.slug = 'yale-phil-176-death' AND t.slug = 'undergraduate';
INSERT IGNORE INTO course_tags (course_id, tag_id)
SELECT co.id, t.id FROM courses co, tags t
 WHERE co.slug = 'yale-phil-176-death' AND t.slug = 'lecture-series';

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'Persons, bodies and souls', 'Dualism against physicalism, and the arguments offered for a soul.', 0 FROM courses co WHERE co.slug = 'yale-phil-176-death'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'Persons, bodies and souls'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 1. Course Introduction', 'Source: Open Yale Courses — PHIL 176: Death, Spring 2007', 'text', 'Part of Open Yale Courses — PHIL 176: Death, Spring 2007.

Watch: https://oyc.yale.edu/philosophy/phil-176/lecture-1', 0, 1, 0
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-176-death' AND s.title = 'Persons, bodies and souls'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 1. Course Introduction');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 2. The Nature of Persons: Dualism vs. Physicalism', 'Source: Open Yale Courses — PHIL 176: Death, Spring 2007', 'text', 'Part of Open Yale Courses — PHIL 176: Death, Spring 2007.

Watch: https://oyc.yale.edu/philosophy/phil-176/lecture-2', 0, 0, 1
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-176-death' AND s.title = 'Persons, bodies and souls'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 2. The Nature of Persons: Dualism vs. Physicalism');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 3. Arguments for the Existence of the Soul, Part I', 'Source: Open Yale Courses — PHIL 176: Death, Spring 2007', 'text', 'Part of Open Yale Courses — PHIL 176: Death, Spring 2007.

Watch: https://oyc.yale.edu/philosophy/phil-176/lecture-3', 0, 0, 2
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-176-death' AND s.title = 'Persons, bodies and souls'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 3. Arguments for the Existence of the Soul, Part I');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 4. Introduction to Plato''s Phaedo; Arguments for the Existence of the Soul, Part II', 'Source: Open Yale Courses — PHIL 176: Death, Spring 2007', 'text', 'Part of Open Yale Courses — PHIL 176: Death, Spring 2007.

Watch: https://oyc.yale.edu/philosophy/phil-176/lecture-4', 0, 0, 3
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-176-death' AND s.title = 'Persons, bodies and souls'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 4. Introduction to Plato''s Phaedo; Arguments for the Existence of the Soul, Part II');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 5. Arguments for the Existence of the Soul, Part III: Free Will and Near-Death Experiences', 'Source: Open Yale Courses — PHIL 176: Death, Spring 2007', 'text', 'Part of Open Yale Courses — PHIL 176: Death, Spring 2007.

Watch: https://oyc.yale.edu/philosophy/phil-176/lecture-5', 0, 0, 4
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-176-death' AND s.title = 'Persons, bodies and souls'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 5. Arguments for the Existence of the Soul, Part III: Free Will and Near-Death Experiences');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 6. Arguments for the Existence of the Soul, Part IV; Plato, Part I', 'Source: Open Yale Courses — PHIL 176: Death, Spring 2007', 'text', 'Part of Open Yale Courses — PHIL 176: Death, Spring 2007.

Watch: https://oyc.yale.edu/philosophy/phil-176/lecture-6', 0, 0, 5
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-176-death' AND s.title = 'Persons, bodies and souls'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 6. Arguments for the Existence of the Soul, Part IV; Plato, Part I');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 7. Plato, Part II: Arguments for the Immortality of the Soul', 'Source: Open Yale Courses — PHIL 176: Death, Spring 2007', 'text', 'Part of Open Yale Courses — PHIL 176: Death, Spring 2007.

Watch: https://oyc.yale.edu/philosophy/phil-176/lecture-7', 0, 0, 6
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-176-death' AND s.title = 'Persons, bodies and souls'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 7. Plato, Part II: Arguments for the Immortality of the Soul');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 8. Plato, Part III: Arguments for the Immortality of the Soul (cont.)', 'Source: Open Yale Courses — PHIL 176: Death, Spring 2007', 'text', 'Part of Open Yale Courses — PHIL 176: Death, Spring 2007.

Watch: https://oyc.yale.edu/philosophy/phil-176/lecture-8', 0, 0, 7
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-176-death' AND s.title = 'Persons, bodies and souls'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 8. Plato, Part III: Arguments for the Immortality of the Soul (cont.)');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 9. Plato, Part IV: Arguments for the Immortality of the Soul (cont.)', 'Source: Open Yale Courses — PHIL 176: Death, Spring 2007', 'text', 'Part of Open Yale Courses — PHIL 176: Death, Spring 2007.

Watch: https://oyc.yale.edu/philosophy/phil-176/lecture-9', 0, 0, 8
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-176-death' AND s.title = 'Persons, bodies and souls'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 9. Plato, Part IV: Arguments for the Immortality of the Soul (cont.)');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'Personal identity', 'What makes someone at one time the same person as someone at another.', 1 FROM courses co WHERE co.slug = 'yale-phil-176-death'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'Personal identity'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 10. Personal Identity, Part I: Identity Across Space and Time and the Soul Theory', 'Source: Open Yale Courses — PHIL 176: Death, Spring 2007', 'text', 'Part of Open Yale Courses — PHIL 176: Death, Spring 2007.

Watch: https://oyc.yale.edu/philosophy/phil-176/lecture-10', 0, 0, 9
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-176-death' AND s.title = 'Personal identity'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 10. Personal Identity, Part I: Identity Across Space and Time and the Soul Theory');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 11. Personal Identity, Part II: The Body Theory and the Personality Theory', 'Source: Open Yale Courses — PHIL 176: Death, Spring 2007', 'text', 'Part of Open Yale Courses — PHIL 176: Death, Spring 2007.

Watch: https://oyc.yale.edu/philosophy/phil-176/lecture-11', 0, 0, 10
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-176-death' AND s.title = 'Personal identity'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 11. Personal Identity, Part II: The Body Theory and the Personality Theory');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 12. Personal Identity, Part III: Objections to the Personality Theory', 'Source: Open Yale Courses — PHIL 176: Death, Spring 2007', 'text', 'Part of Open Yale Courses — PHIL 176: Death, Spring 2007.

Watch: https://oyc.yale.edu/philosophy/phil-176/lecture-12', 0, 0, 11
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-176-death' AND s.title = 'Personal identity'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 12. Personal Identity, Part III: Objections to the Personality Theory');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 13. Personal Identity, Part IV: What Matters?', 'Source: Open Yale Courses — PHIL 176: Death, Spring 2007', 'text', 'Part of Open Yale Courses — PHIL 176: Death, Spring 2007.

Watch: https://oyc.yale.edu/philosophy/phil-176/lecture-13', 0, 0, 12
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-176-death' AND s.title = 'Personal identity'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 13. Personal Identity, Part IV: What Matters?');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'The nature and badness of death', 'What death is, why it might be bad, and whether immortality would be better.', 2 FROM courses co WHERE co.slug = 'yale-phil-176-death'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'The nature and badness of death'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 14. What Matters (cont.); The Nature of Death, Part I', 'Source: Open Yale Courses — PHIL 176: Death, Spring 2007', 'text', 'Part of Open Yale Courses — PHIL 176: Death, Spring 2007.

Watch: https://oyc.yale.edu/philosophy/phil-176/lecture-14', 0, 0, 13
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-176-death' AND s.title = 'The nature and badness of death'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 14. What Matters (cont.); The Nature of Death, Part I');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 15. The Nature of Death (cont.); Believing You Will Die', 'Source: Open Yale Courses — PHIL 176: Death, Spring 2007', 'text', 'Part of Open Yale Courses — PHIL 176: Death, Spring 2007.

Watch: https://oyc.yale.edu/philosophy/phil-176/lecture-15', 0, 0, 14
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-176-death' AND s.title = 'The nature and badness of death'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 15. The Nature of Death (cont.); Believing You Will Die');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 16. Dying Alone; The Badness of Death, Part I', 'Source: Open Yale Courses — PHIL 176: Death, Spring 2007', 'text', 'Part of Open Yale Courses — PHIL 176: Death, Spring 2007.

Watch: https://oyc.yale.edu/philosophy/phil-176/lecture-16', 0, 0, 15
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-176-death' AND s.title = 'The nature and badness of death'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 16. Dying Alone; The Badness of Death, Part I');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 17. The Badness of Death, Part II: The Deprivation Account', 'Source: Open Yale Courses — PHIL 176: Death, Spring 2007', 'text', 'Part of Open Yale Courses — PHIL 176: Death, Spring 2007.

Watch: https://oyc.yale.edu/philosophy/phil-176/lecture-17', 0, 0, 16
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-176-death' AND s.title = 'The nature and badness of death'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 17. The Badness of Death, Part II: The Deprivation Account');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 18. The Badness of Death, Part III; Immortality, Part I', 'Source: Open Yale Courses — PHIL 176: Death, Spring 2007', 'text', 'Part of Open Yale Courses — PHIL 176: Death, Spring 2007.

Watch: https://oyc.yale.edu/philosophy/phil-176/lecture-18', 0, 0, 17
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-176-death' AND s.title = 'The nature and badness of death'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 18. The Badness of Death, Part III; Immortality, Part I');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 19. Immortality, Part II; The Value of Life, Part I', 'Source: Open Yale Courses — PHIL 176: Death, Spring 2007', 'text', 'Part of Open Yale Courses — PHIL 176: Death, Spring 2007.

Watch: https://oyc.yale.edu/philosophy/phil-176/lecture-19', 0, 0, 18
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-176-death' AND s.title = 'The nature and badness of death'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 19. Immortality, Part II; The Value of Life, Part I');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 20. The Value of Life, Part II; Other Bad Aspects of Death, Part I', 'Source: Open Yale Courses — PHIL 176: Death, Spring 2007', 'text', 'Part of Open Yale Courses — PHIL 176: Death, Spring 2007.

Watch: https://oyc.yale.edu/philosophy/phil-176/lecture-20', 0, 0, 19
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-176-death' AND s.title = 'The nature and badness of death'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 20. The Value of Life, Part II; Other Bad Aspects of Death, Part I');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 21. Other Bad Aspects of Death, Part II', 'Source: Open Yale Courses — PHIL 176: Death, Spring 2007', 'text', 'Part of Open Yale Courses — PHIL 176: Death, Spring 2007.

Watch: https://oyc.yale.edu/philosophy/phil-176/lecture-21', 0, 0, 20
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-176-death' AND s.title = 'The nature and badness of death'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 21. Other Bad Aspects of Death, Part II');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'Living with mortality', 'Fear, value, and how the certainty of death should bear on how a life is led.', 3 FROM courses co WHERE co.slug = 'yale-phil-176-death'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'Living with mortality'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 22. Fear of Death', 'Source: Open Yale Courses — PHIL 176: Death, Spring 2007', 'text', 'Part of Open Yale Courses — PHIL 176: Death, Spring 2007.

Watch: https://oyc.yale.edu/philosophy/phil-176/lecture-22', 0, 0, 21
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-176-death' AND s.title = 'Living with mortality'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 22. Fear of Death');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 23. How to Live Given the Certainty of Death', 'Source: Open Yale Courses — PHIL 176: Death, Spring 2007', 'text', 'Part of Open Yale Courses — PHIL 176: Death, Spring 2007.

Watch: https://oyc.yale.edu/philosophy/phil-176/lecture-23', 0, 0, 22
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-176-death' AND s.title = 'Living with mortality'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 23. How to Live Given the Certainty of Death');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 24. Suicide, Part I: The Rationality of Suicide', 'Source: Open Yale Courses — PHIL 176: Death, Spring 2007', 'text', 'Part of Open Yale Courses — PHIL 176: Death, Spring 2007.

Watch: https://oyc.yale.edu/philosophy/phil-176/lecture-24', 0, 0, 23
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-176-death' AND s.title = 'Living with mortality'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 24. Suicide, Part I: The Rationality of Suicide');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 25. Suicide, Part II: Deciding under Uncertainty', 'Source: Open Yale Courses — PHIL 176: Death, Spring 2007', 'text', 'Part of Open Yale Courses — PHIL 176: Death, Spring 2007.

Watch: https://oyc.yale.edu/philosophy/phil-176/lecture-25', 0, 0, 24
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-176-death' AND s.title = 'Living with mortality'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 25. Suicide, Part II: Deciding under Uncertainty');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 26. Suicide, Part III: The Morality of Suicide and Course Conclusion', 'Source: Open Yale Courses — PHIL 176: Death, Spring 2007', 'text', 'Part of Open Yale Courses — PHIL 176: Death, Spring 2007.

Watch: https://oyc.yale.edu/philosophy/phil-176/lecture-26', 0, 0, 25
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-176-death' AND s.title = 'Living with mortality'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 26. Suicide, Part III: The Morality of Suicide and Course Conclusion');

-- --------------------------------------------------------------------------
-- Philosophy and the Science of Human Nature (Yale PHIL 181)
-- Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature
-- --------------------------------------------------------------------------
INSERT IGNORE INTO courses
  (instructor_id, category_id, title, slug, subtitle, img, description,
   content_type, content, price, is_published)
SELECT u.id, c.id, 'Philosophy and the Science of Human Nature (Yale PHIL 181)', 'yale-phil-181-human-nature', 'Plato, Aristotle, Kant and Mill read against modern cognitive science', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1200&q=80',
       'Prof. Tamar Gendler pairs central texts of Western philosophy — Plato, Aristotle, Epictetus, Hobbes, Kant, Mill, Rawls, Nozick — with what psychology and cognitive science have since discovered about how people actually think and behave.

Three movements: happiness and flourishing, morality and justice, then political legitimacy and the structures of a society. The recurring question is what happens to an old argument when the empirical claim buried inside it turns out to be testable.',
       'text', 'Prof. Tamar Gendler pairs central texts of Western philosophy — Plato, Aristotle, Epictetus, Hobbes, Kant, Mill, Rawls, Nozick — with what psychology and cognitive science have since discovered about how people actually think and behave.

Three movements: happiness and flourishing, morality and justice, then political legitimacy and the structures of a society. The recurring question is what happens to an old argument when the empirical claim buried inside it turns out to be testable.

Source: Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature
Taught by: Prof. Tamar Gendler (Yale)
Licence: CC BY-NC-SA 3.0
Course home: https://oyc.yale.edu/philosophy/phil-181', 0.00, 1
  FROM users u, categories c
 WHERE u.email = 'library@youlearn.local' AND c.slug = 'philosophy';

INSERT IGNORE INTO course_tags (course_id, tag_id)
SELECT co.id, t.id FROM courses co, tags t
 WHERE co.slug = 'yale-phil-181-human-nature' AND t.slug = 'ethics';
INSERT IGNORE INTO course_tags (course_id, tag_id)
SELECT co.id, t.id FROM courses co, tags t
 WHERE co.slug = 'yale-phil-181-human-nature' AND t.slug = 'cognitive-science';
INSERT IGNORE INTO course_tags (course_id, tag_id)
SELECT co.id, t.id FROM courses co, tags t
 WHERE co.slug = 'yale-phil-181-human-nature' AND t.slug = 'open-yale-courses';
INSERT IGNORE INTO course_tags (course_id, tag_id)
SELECT co.id, t.id FROM courses co, tags t
 WHERE co.slug = 'yale-phil-181-human-nature' AND t.slug = 'undergraduate';

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'Happiness and flourishing', 'Plato and Aristotle on the divided soul, read alongside what psychology has since found.', 0 FROM courses co WHERE co.slug = 'yale-phil-181-human-nature'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'Happiness and flourishing'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 1. Introduction', 'Source: Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature', 'text', 'Part of Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature.

Watch: https://oyc.yale.edu/philosophy/phil-181/lecture-1', 0, 1, 0
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-181-human-nature' AND s.title = 'Happiness and flourishing'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 1. Introduction');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 2. The Ring of Gyges: Morality and Hypocrisy', 'Source: Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature', 'text', 'Part of Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature.

Watch: https://oyc.yale.edu/philosophy/phil-181/lecture-2', 0, 0, 1
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-181-human-nature' AND s.title = 'Happiness and flourishing'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 2. The Ring of Gyges: Morality and Hypocrisy');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 3. Parts of the Soul I', 'Source: Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature', 'text', 'Part of Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature.

Watch: https://oyc.yale.edu/philosophy/phil-181/lecture-3', 0, 0, 2
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-181-human-nature' AND s.title = 'Happiness and flourishing'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 3. Parts of the Soul I');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 4. Parts of the Soul II', 'Source: Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature', 'text', 'Part of Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature.

Watch: https://oyc.yale.edu/philosophy/phil-181/lecture-4', 0, 0, 3
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-181-human-nature' AND s.title = 'Happiness and flourishing'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 4. Parts of the Soul II');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 5. The Well-Ordered Soul: Happiness and Harmony', 'Source: Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature', 'text', 'Part of Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature.

Watch: https://oyc.yale.edu/philosophy/phil-181/lecture-5', 0, 0, 4
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-181-human-nature' AND s.title = 'Happiness and flourishing'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 5. The Well-Ordered Soul: Happiness and Harmony');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 6. The Disordered Soul: Thémis and PTSD', 'Source: Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature', 'text', 'Part of Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature.

Watch: https://oyc.yale.edu/philosophy/phil-181/lecture-6', 0, 0, 5
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-181-human-nature' AND s.title = 'Happiness and flourishing'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 6. The Disordered Soul: Thémis and PTSD');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 7. Flourishing and Attachment', 'Source: Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature', 'text', 'Part of Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature.

Watch: https://oyc.yale.edu/philosophy/phil-181/lecture-7', 0, 0, 6
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-181-human-nature' AND s.title = 'Happiness and flourishing'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 7. Flourishing and Attachment');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 8. Flourishing and Detachment', 'Source: Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature', 'text', 'Part of Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature.

Watch: https://oyc.yale.edu/philosophy/phil-181/lecture-8', 0, 0, 7
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-181-human-nature' AND s.title = 'Happiness and flourishing'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 8. Flourishing and Detachment');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 9. Virtue and Habit I', 'Source: Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature', 'text', 'Part of Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature.

Watch: https://oyc.yale.edu/philosophy/phil-181/lecture-9', 0, 0, 8
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-181-human-nature' AND s.title = 'Happiness and flourishing'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 9. Virtue and Habit I');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 10. Virtue and Habit II', 'Source: Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature', 'text', 'Part of Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature.

Watch: https://oyc.yale.edu/philosophy/phil-181/lecture-10', 0, 0, 9
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-181-human-nature' AND s.title = 'Happiness and flourishing'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 10. Virtue and Habit II');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 11. Weakness of the Will and Procrastination', 'Source: Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature', 'text', 'Part of Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature.

Watch: https://oyc.yale.edu/philosophy/phil-181/lecture-11', 0, 0, 10
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-181-human-nature' AND s.title = 'Happiness and flourishing'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 11. Weakness of the Will and Procrastination');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'Morality and justice', 'Utilitarianism, deontology, the trolley problem, and what experiments reveal about moral judgement.', 1 FROM courses co WHERE co.slug = 'yale-phil-181-human-nature'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'Morality and justice'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 12. Utilitarianism and its Critiques', 'Source: Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature', 'text', 'Part of Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature.

Watch: https://oyc.yale.edu/philosophy/phil-181/lecture-12', 0, 0, 11
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-181-human-nature' AND s.title = 'Morality and justice'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 12. Utilitarianism and its Critiques');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 13. Deontology', 'Source: Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature', 'text', 'Part of Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature.

Watch: https://oyc.yale.edu/philosophy/phil-181/lecture-13', 0, 0, 12
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-181-human-nature' AND s.title = 'Morality and justice'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 13. Deontology');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 14. The Trolley Problem', 'Source: Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature', 'text', 'Part of Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature.

Watch: https://oyc.yale.edu/philosophy/phil-181/lecture-14', 0, 0, 13
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-181-human-nature' AND s.title = 'Morality and justice'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 14. The Trolley Problem');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 15. Empirically-informed Responses', 'Source: Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature', 'text', 'Part of Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature.

Watch: https://oyc.yale.edu/philosophy/phil-181/lecture-15', 0, 0, 14
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-181-human-nature' AND s.title = 'Morality and justice'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 15. Empirically-informed Responses');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 16. Philosophical Puzzles', 'Source: Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature', 'text', 'Part of Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature.

Watch: https://oyc.yale.edu/philosophy/phil-181/lecture-16', 0, 0, 15
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-181-human-nature' AND s.title = 'Morality and justice'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 16. Philosophical Puzzles');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 17. Punishment I', 'Source: Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature', 'text', 'Part of Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature.

Watch: https://oyc.yale.edu/philosophy/phil-181/lecture-17', 0, 0, 16
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-181-human-nature' AND s.title = 'Morality and justice'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 17. Punishment I');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 18. Punishment II', 'Source: Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature', 'text', 'Part of Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature.

Watch: https://oyc.yale.edu/philosophy/phil-181/lecture-18', 0, 0, 17
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-181-human-nature' AND s.title = 'Morality and justice'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 18. Punishment II');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'Political legitimacy and social structures', 'Hobbes, the prisoner''s dilemma, equality, and the structures that shape a society.', 2 FROM courses co WHERE co.slug = 'yale-phil-181-human-nature'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'Political legitimacy and social structures'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 19. Contract and Commonwealth: Thomas Hobbes', 'Source: Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature', 'text', 'Part of Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature.

Watch: https://oyc.yale.edu/philosophy/phil-181/lecture-19', 0, 0, 18
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-181-human-nature' AND s.title = 'Political legitimacy and social structures'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 19. Contract and Commonwealth: Thomas Hobbes');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 20. The Prisoner''s Dilemma', 'Source: Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature', 'text', 'Part of Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature.

Watch: https://oyc.yale.edu/philosophy/phil-181/lecture-20', 0, 0, 19
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-181-human-nature' AND s.title = 'Political legitimacy and social structures'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 20. The Prisoner''s Dilemma');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 21. Equality', 'Source: Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature', 'text', 'Part of Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature.

Watch: https://oyc.yale.edu/philosophy/phil-181/lecture-21', 0, 0, 20
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-181-human-nature' AND s.title = 'Political legitimacy and social structures'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 21. Equality');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 22. Equality II', 'Source: Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature', 'text', 'Part of Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature.

Watch: https://oyc.yale.edu/philosophy/phil-181/lecture-22', 0, 0, 21
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-181-human-nature' AND s.title = 'Political legitimacy and social structures'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 22. Equality II');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 23. Social Structures', 'Source: Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature', 'text', 'Part of Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature.

Watch: https://oyc.yale.edu/philosophy/phil-181/lecture-23', 0, 0, 22
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-181-human-nature' AND s.title = 'Political legitimacy and social structures'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 23. Social Structures');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 24. Censorship', 'Source: Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature', 'text', 'Part of Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature.

Watch: https://oyc.yale.edu/philosophy/phil-181/lecture-24', 0, 0, 23
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-181-human-nature' AND s.title = 'Political legitimacy and social structures'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 24. Censorship');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 25. Tying up Loose Ends', 'Source: Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature', 'text', 'Part of Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature.

Watch: https://oyc.yale.edu/philosophy/phil-181/lecture-25', 0, 0, 24
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-181-human-nature' AND s.title = 'Political legitimacy and social structures'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 25. Tying up Loose Ends');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'Lecture 26. Concluding Lecture', 'Source: Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature', 'text', 'Part of Open Yale Courses — PHIL 181: Philosophy and the Science of Human Nature.

Watch: https://oyc.yale.edu/philosophy/phil-181/lecture-26', 0, 0, 25
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'yale-phil-181-human-nature' AND s.title = 'Political legitimacy and social structures'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.course_id = co.id AND l.title = 'Lecture 26. Concluding Lecture');

