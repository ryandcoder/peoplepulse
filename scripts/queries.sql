-- Example analysis queries (connect on localhost:5433, db "peoplepulse"). The API computes the same
-- numbers with Pandas; these show the equivalent SQL.

-- Overall attrition
SELECT COUNT(*) AS employees, SUM(attrition_flag) AS left_company,
       ROUND(100.0 * AVG(attrition_flag), 1) AS attrition_rate_pct
FROM employees;

-- Attrition by department / job role (count + rate)
SELECT department, COUNT(*) AS employees, SUM(attrition_flag) AS left_company,
       ROUND(100.0 * AVG(attrition_flag), 1) AS attrition_rate_pct
FROM employees GROUP BY department ORDER BY attrition_rate_pct DESC;

SELECT job_role, COUNT(*) AS employees, SUM(attrition_flag) AS left_company,
       ROUND(100.0 * AVG(attrition_flag), 1) AS attrition_rate_pct
FROM employees GROUP BY job_role ORDER BY attrition_rate_pct DESC;

-- Overtime
SELECT over_time, COUNT(*) AS employees, SUM(attrition_flag) AS left_company,
       ROUND(100.0 * AVG(attrition_flag), 1) AS attrition_rate_pct
FROM employees GROUP BY over_time;

-- Satisfaction / work-life balance
SELECT job_satisfaction, COUNT(*) AS employees, ROUND(100.0 * AVG(attrition_flag), 1) AS attrition_rate_pct
FROM employees GROUP BY job_satisfaction ORDER BY job_satisfaction;

-- Income: stayed vs left
SELECT attrition, ROUND(AVG(monthly_income)) AS avg_income,
       PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY monthly_income) AS median_income
FROM employees GROUP BY attrition;

-- Tenure and age groups
SELECT tenure_group, COUNT(*) AS employees, ROUND(100.0 * AVG(attrition_flag), 1) AS attrition_rate_pct
FROM employees GROUP BY tenure_group ORDER BY MIN(years_at_company);

SELECT age_group, COUNT(*) AS employees, ROUND(100.0 * AVG(attrition_flag), 1) AS attrition_rate_pct
FROM employees GROUP BY age_group ORDER BY MIN(age);

-- Segments with at least 20 employees
SELECT job_role, over_time, COUNT(*) AS employees, ROUND(100.0 * AVG(attrition_flag), 1) AS attrition_rate_pct
FROM employees GROUP BY job_role, over_time HAVING COUNT(*) >= 20
ORDER BY attrition_rate_pct DESC LIMIT 10;
