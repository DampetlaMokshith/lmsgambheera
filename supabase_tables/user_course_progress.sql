 SELECT ce.user_id,
    ce.course_id,
    c.title AS course_title,
    c.slug AS course_slug,
    c.thumbnail_url,
    c.faculty_name,
    ce.progress,
    ce.status,
    ce.enrolled_at,
    ce.last_accessed,
    ce.completed_at,
    ce.certificate_issued
   FROM course_enrollments ce
     JOIN courses c ON ce.course_id = c.id;