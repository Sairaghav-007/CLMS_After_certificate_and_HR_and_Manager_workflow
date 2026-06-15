--
-- PostgreSQL database dump
--

\restrict ebJ04PZVfu9YKWxgfuxQcvO9KwFF0yROW76AL0xWeVxD9RzmuvYm70swCetledC

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public."Sessions" DROP CONSTRAINT IF EXISTS "Sessions_pkey";
ALTER TABLE IF EXISTS ONLY public."Module" DROP CONSTRAINT IF EXISTS "Module_pkey";
ALTER TABLE IF EXISTS ONLY public."Group" DROP CONSTRAINT IF EXISTS "Group_pkey";
ALTER TABLE IF EXISTS ONLY public."Employee_table" DROP CONSTRAINT IF EXISTS "Employee_table_pkey";
ALTER TABLE IF EXISTS ONLY public."Courses" DROP CONSTRAINT IF EXISTS "Courses_pkey";
DROP TABLE IF EXISTS public."Sessions";
DROP TABLE IF EXISTS public."Role";
DROP TABLE IF EXISTS public."Module";
DROP TABLE IF EXISTS public."Group";
DROP TABLE IF EXISTS public."Employee_table";
DROP TABLE IF EXISTS public."Courses";
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Courses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Courses" (
    "C_Unique_ID" character varying(200) NOT NULL,
    "C_Name" character varying(10485760) NOT NULL,
    "C_Description" character varying(10485760)[] NOT NULL,
    "C_Keyword" character varying(10485760) NOT NULL,
    "C_Thumbnail" character varying(10485760) NOT NULL,
    "C_Author_Names" character varying(200) NOT NULL,
    "C_Author_Emails" character varying(2000) NOT NULL,
    "C_Due_Date_Registration" integer NOT NULL,
    "C_Due_Date_Completion" integer NOT NULL,
    "C_List_Modeule_ID" character varying(10485760) NOT NULL,
    "C_Mandatory " boolean NOT NULL,
    "C_Department " character varying(10485760) NOT NULL,
    "C_Stage" character varying(200) NOT NULL
);


ALTER TABLE public."Courses" OWNER TO postgres;

--
-- Name: Employee_table; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Employee_table" (
    "E_Unique_ID" character varying(20) NOT NULL,
    "E_Email" character varying(200) NOT NULL,
    "E_First_Name" character varying(50) NOT NULL,
    "E_Middle_Name" character varying(50),
    "E_Last_Name" character varying(50),
    "E_Password" character varying(50) NOT NULL,
    "E_Department " character varying(50) NOT NULL,
    "E_Level" character varying(50) NOT NULL,
    "E_Course_ID " character varying(10485760),
    "E_Leaning_path_ID" character varying(10485760),
    "E_Joining_Year" integer NOT NULL
);


ALTER TABLE public."Employee_table" OWNER TO postgres;

--
-- Name: Group; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Group" (
    "G_Unique_Id" character varying(300) NOT NULL,
    "G_Name" character varying(200),
    "G_Course_Id" character varying(200) NOT NULL,
    "G_Total_Number_Of_Employee" integer NOT NULL,
    "G_List_of_Employee_ID" character varying(10485760) NOT NULL,
    "G_List_Of_Completed_ID" character varying(10485760) NOT NULL,
    "G_List_Of_Non_Completed_ID" character varying(10485760) NOT NULL,
    "G_List_Of Score_ID" character varying(10485760) NOT NULL,
    "G_Average_Score" integer NOT NULL
);


ALTER TABLE public."Group" OWNER TO postgres;

--
-- Name: Module; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Module" (
    "M_Unique_ID" character varying(300) NOT NULL,
    "M_Module_Name" character varying(500) NOT NULL,
    "M_Module_Description" character varying(10485760) NOT NULL,
    "M_List_Session_ID" character varying(10485760) NOT NULL,
    "M_Course_ID" character varying(300) NOT NULL
);


ALTER TABLE public."Module" OWNER TO postgres;

--
-- Name: Role; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Role" (
    "R_Unique_ID" character varying(200) NOT NULL,
    "R_Email" character varying(200) NOT NULL,
    "R_Password" character varying(200) NOT NULL,
    "R_Firts_name" character(200) NOT NULL,
    "R_Middle_Name" character(200),
    "R_Last_Name" character(200),
    "R_Role" character varying(100) NOT NULL,
    "R_Joining_Year" integer NOT NULL
);


ALTER TABLE public."Role" OWNER TO postgres;

--
-- Name: Sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Sessions" (
    "S_Unique_ID" character varying(300) NOT NULL,
    "S_Course_ID" character varying(300) NOT NULL,
    "S_Module_ID" character varying(300) NOT NULL,
    "S_Name" character varying(500) NOT NULL,
    "S_Description" character varying(10485760) NOT NULL,
    "S_Type_1" character varying(200) NOT NULL,
    "S_Link_1" character varying(2000) NOT NULL,
    "S_Type_2" character varying(200),
    "S_Link_2" character varying(2000)
);


ALTER TABLE public."Sessions" OWNER TO postgres;

--
-- Data for Name: Courses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Courses" ("C_Unique_ID", "C_Name", "C_Description", "C_Keyword", "C_Thumbnail", "C_Author_Names", "C_Author_Emails", "C_Due_Date_Registration", "C_Due_Date_Completion", "C_List_Modeule_ID", "C_Mandatory ", "C_Department ", "C_Stage") FROM stdin;
\.


--
-- Data for Name: Employee_table; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Employee_table" ("E_Unique_ID", "E_Email", "E_First_Name", "E_Middle_Name", "E_Last_Name", "E_Password", "E_Department ", "E_Level", "E_Course_ID ", "E_Leaning_path_ID", "E_Joining_Year") FROM stdin;
\.


--
-- Data for Name: Group; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Group" ("G_Unique_Id", "G_Name", "G_Course_Id", "G_Total_Number_Of_Employee", "G_List_of_Employee_ID", "G_List_Of_Completed_ID", "G_List_Of_Non_Completed_ID", "G_List_Of Score_ID", "G_Average_Score") FROM stdin;
\.


--
-- Data for Name: Module; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Module" ("M_Unique_ID", "M_Module_Name", "M_Module_Description", "M_List_Session_ID", "M_Course_ID") FROM stdin;
\.


--
-- Data for Name: Role; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Role" ("R_Unique_ID", "R_Email", "R_Password", "R_Firts_name", "R_Middle_Name", "R_Last_Name", "R_Role", "R_Joining_Year") FROM stdin;
\.


--
-- Data for Name: Sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Sessions" ("S_Unique_ID", "S_Course_ID", "S_Module_ID", "S_Name", "S_Description", "S_Type_1", "S_Link_1", "S_Type_2", "S_Link_2") FROM stdin;
\.


--
-- Name: Courses Courses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Courses"
    ADD CONSTRAINT "Courses_pkey" PRIMARY KEY ("C_Unique_ID");


--
-- Name: Employee_table Employee_table_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Employee_table"
    ADD CONSTRAINT "Employee_table_pkey" PRIMARY KEY ("E_Unique_ID");


--
-- Name: Group Group_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Group"
    ADD CONSTRAINT "Group_pkey" PRIMARY KEY ("G_Unique_Id");


--
-- Name: Module Module_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Module"
    ADD CONSTRAINT "Module_pkey" PRIMARY KEY ("M_Unique_ID");


--
-- Name: Sessions Sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Sessions"
    ADD CONSTRAINT "Sessions_pkey" PRIMARY KEY ("S_Unique_ID");


--
-- PostgreSQL database dump complete
--

\unrestrict ebJ04PZVfu9YKWxgfuxQcvO9KwFF0yROW76AL0xWeVxD9RzmuvYm70swCetledC

