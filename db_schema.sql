--
-- PostgreSQL database dump
--

\restrict 9hCNpu0w6Lmk9gzB538vsYUgO6sdihyV205mPs7hfGDcw8I6qMqV975wEn7Hj51

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: thrift
--

CREATE TABLE public.audit_log (
    log_id bigint NOT NULL,
    admin_id uuid NOT NULL,
    action character varying(255) NOT NULL,
    target_type character varying(255) NOT NULL,
    target_id character varying(255) NOT NULL,
    metadata jsonb,
    performed_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_log OWNER TO thrift;

--
-- Name: audit_log_log_id_seq; Type: SEQUENCE; Schema: public; Owner: thrift
--

CREATE SEQUENCE public.audit_log_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_log_log_id_seq OWNER TO thrift;

--
-- Name: audit_log_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: thrift
--

ALTER SEQUENCE public.audit_log_log_id_seq OWNED BY public.audit_log.log_id;


--
-- Name: cache; Type: TABLE; Schema: public; Owner: thrift
--

CREATE TABLE public.cache (
    key character varying(255) NOT NULL,
    value text NOT NULL,
    expiration bigint NOT NULL
);


ALTER TABLE public.cache OWNER TO thrift;

--
-- Name: cache_locks; Type: TABLE; Schema: public; Owner: thrift
--

CREATE TABLE public.cache_locks (
    key character varying(255) NOT NULL,
    owner character varying(255) NOT NULL,
    expiration bigint NOT NULL
);


ALTER TABLE public.cache_locks OWNER TO thrift;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: thrift
--

CREATE TABLE public.categories (
    category_id integer NOT NULL,
    category_name character varying(255) NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.categories OWNER TO thrift;

--
-- Name: categories_category_id_seq; Type: SEQUENCE; Schema: public; Owner: thrift
--

CREATE SEQUENCE public.categories_category_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_category_id_seq OWNER TO thrift;

--
-- Name: categories_category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: thrift
--

ALTER SEQUENCE public.categories_category_id_seq OWNED BY public.categories.category_id;


--
-- Name: failed_jobs; Type: TABLE; Schema: public; Owner: thrift
--

CREATE TABLE public.failed_jobs (
    id bigint NOT NULL,
    uuid character varying(255) NOT NULL,
    connection text NOT NULL,
    queue text NOT NULL,
    payload text NOT NULL,
    exception text NOT NULL,
    failed_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.failed_jobs OWNER TO thrift;

--
-- Name: failed_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: thrift
--

CREATE SEQUENCE public.failed_jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.failed_jobs_id_seq OWNER TO thrift;

--
-- Name: failed_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: thrift
--

ALTER SEQUENCE public.failed_jobs_id_seq OWNED BY public.failed_jobs.id;


--
-- Name: job_batches; Type: TABLE; Schema: public; Owner: thrift
--

CREATE TABLE public.job_batches (
    id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    total_jobs integer NOT NULL,
    pending_jobs integer NOT NULL,
    failed_jobs integer NOT NULL,
    failed_job_ids text NOT NULL,
    options text,
    cancelled_at integer,
    created_at integer NOT NULL,
    finished_at integer
);


ALTER TABLE public.job_batches OWNER TO thrift;

--
-- Name: jobs; Type: TABLE; Schema: public; Owner: thrift
--

CREATE TABLE public.jobs (
    id bigint NOT NULL,
    queue character varying(255) NOT NULL,
    payload text NOT NULL,
    attempts smallint NOT NULL,
    reserved_at integer,
    available_at integer NOT NULL,
    created_at integer NOT NULL
);


ALTER TABLE public.jobs OWNER TO thrift;

--
-- Name: jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: thrift
--

CREATE SEQUENCE public.jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.jobs_id_seq OWNER TO thrift;

--
-- Name: jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: thrift
--

ALTER SEQUENCE public.jobs_id_seq OWNED BY public.jobs.id;


--
-- Name: listings; Type: TABLE; Schema: public; Owner: thrift
--

CREATE TABLE public.listings (
    listing_id uuid NOT NULL,
    seller_id uuid NOT NULL,
    category_id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    price numeric(10,2) NOT NULL,
    condition character varying(255) NOT NULL,
    images jsonb DEFAULT '[]'::jsonb NOT NULL,
    status character varying(255) DEFAULT 'draft'::character varying NOT NULL,
    location character varying(255),
    expires_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    interested_buyer_id uuid
);


ALTER TABLE public.listings OWNER TO thrift;

--
-- Name: migrations; Type: TABLE; Schema: public; Owner: thrift
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    migration character varying(255) NOT NULL,
    batch integer NOT NULL
);


ALTER TABLE public.migrations OWNER TO thrift;

--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: thrift
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.migrations_id_seq OWNER TO thrift;

--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: thrift
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: thrift
--

CREATE TABLE public.notifications (
    notification_id uuid NOT NULL,
    user_id uuid NOT NULL,
    type character varying(255) NOT NULL,
    channel character varying(255) DEFAULT 'in_app'::character varying NOT NULL,
    subject character varying(255),
    body text NOT NULL,
    status character varying(255) DEFAULT 'unread'::character varying NOT NULL,
    sent_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.notifications OWNER TO thrift;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: thrift
--

CREATE TABLE public.payments (
    payment_id uuid NOT NULL,
    seller_id uuid NOT NULL,
    listing_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency character(3) DEFAULT 'USD'::bpchar NOT NULL,
    method character varying(255),
    status character varying(255) DEFAULT 'pending'::character varying NOT NULL,
    transaction_ref character varying(255),
    gateway_response jsonb,
    paid_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.payments OWNER TO thrift;

--
-- Name: personal_access_tokens; Type: TABLE; Schema: public; Owner: thrift
--

CREATE TABLE public.personal_access_tokens (
    id bigint NOT NULL,
    tokenable_type character varying(255) NOT NULL,
    tokenable_id bigint NOT NULL,
    name text NOT NULL,
    token character varying(64) NOT NULL,
    abilities text,
    last_used_at timestamp(0) without time zone,
    expires_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.personal_access_tokens OWNER TO thrift;

--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: thrift
--

CREATE SEQUENCE public.personal_access_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.personal_access_tokens_id_seq OWNER TO thrift;

--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: thrift
--

ALTER SEQUENCE public.personal_access_tokens_id_seq OWNED BY public.personal_access_tokens.id;


--
-- Name: reports; Type: TABLE; Schema: public; Owner: thrift
--

CREATE TABLE public.reports (
    report_id uuid NOT NULL,
    reporter_id uuid NOT NULL,
    target_type character varying(255) NOT NULL,
    target_id uuid NOT NULL,
    reason text NOT NULL,
    status character varying(255) DEFAULT 'pending'::character varying NOT NULL,
    admin_id uuid,
    admin_notes text,
    resolved_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.reports OWNER TO thrift;

--
-- Name: reviews; Type: TABLE; Schema: public; Owner: thrift
--

CREATE TABLE public.reviews (
    review_id uuid NOT NULL,
    buyer_id uuid NOT NULL,
    seller_id uuid NOT NULL,
    rating smallint NOT NULL,
    comment text,
    seller_response text,
    seller_responded_at timestamp(0) without time zone,
    is_removed boolean DEFAULT false NOT NULL,
    removed_by uuid,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    listing_id uuid NOT NULL
);


ALTER TABLE public.reviews OWNER TO thrift;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: thrift
--

CREATE TABLE public.sessions (
    id character varying(255) NOT NULL,
    user_id bigint,
    ip_address character varying(45),
    user_agent text,
    payload text NOT NULL,
    last_activity integer NOT NULL
);


ALTER TABLE public.sessions OWNER TO thrift;

--
-- Name: users; Type: TABLE; Schema: public; Owner: thrift
--

CREATE TABLE public.users (
    user_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(255) NOT NULL,
    password_hash text NOT NULL,
    profile_photo_url text,
    role character varying(255) DEFAULT 'user'::character varying NOT NULL,
    is_blocked boolean DEFAULT false NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.users OWNER TO thrift;

--
-- Name: audit_log log_id; Type: DEFAULT; Schema: public; Owner: thrift
--

ALTER TABLE ONLY public.audit_log ALTER COLUMN log_id SET DEFAULT nextval('public.audit_log_log_id_seq'::regclass);


--
-- Name: categories category_id; Type: DEFAULT; Schema: public; Owner: thrift
--

ALTER TABLE ONLY public.categories ALTER COLUMN category_id SET DEFAULT nextval('public.categories_category_id_seq'::regclass);


--
-- Name: failed_jobs id; Type: DEFAULT; Schema: public; Owner: thrift
--

ALTER TABLE ONLY public.failed_jobs ALTER COLUMN id SET DEFAULT nextval('public.failed_jobs_id_seq'::regclass);


--
-- Name: jobs id; Type: DEFAULT; Schema: public; Owner: thrift
--

ALTER TABLE ONLY public.jobs ALTER COLUMN id SET DEFAULT nextval('public.jobs_id_seq'::regclass);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: thrift
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: personal_access_tokens id; Type: DEFAULT; Schema: public; Owner: thrift
--

ALTER TABLE ONLY public.personal_access_tokens ALTER COLUMN id SET DEFAULT nextval('public.personal_access_tokens_id_seq'::regclass);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: thrift
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (log_id);


--
-- Name: cache_locks cache_locks_pkey; Type: CONSTRAINT; Schema: public; Owner: thrift
--

ALTER TABLE ONLY public.cache_locks
    ADD CONSTRAINT cache_locks_pkey PRIMARY KEY (key);


--
-- Name: cache cache_pkey; Type: CONSTRAINT; Schema: public; Owner: thrift
--

ALTER TABLE ONLY public.cache
    ADD CONSTRAINT cache_pkey PRIMARY KEY (key);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: thrift
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (category_id);


--
-- Name: failed_jobs failed_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: thrift
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_pkey PRIMARY KEY (id);


--
-- Name: failed_jobs failed_jobs_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: thrift
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_uuid_unique UNIQUE (uuid);


--
-- Name: job_batches job_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: thrift
--

ALTER TABLE ONLY public.job_batches
    ADD CONSTRAINT job_batches_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: thrift
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: thrift
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: thrift
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (notification_id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: thrift
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (payment_id);


--
-- Name: personal_access_tokens personal_access_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: thrift
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_pkey PRIMARY KEY (id);


--
-- Name: personal_access_tokens personal_access_tokens_token_unique; Type: CONSTRAINT; Schema: public; Owner: thrift
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_token_unique UNIQUE (token);


--
-- Name: listings products_pkey; Type: CONSTRAINT; Schema: public; Owner: thrift
--

ALTER TABLE ONLY public.listings
    ADD CONSTRAINT products_pkey PRIMARY KEY (listing_id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: thrift
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (report_id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: thrift
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (review_id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: thrift
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: thrift
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_phone_unique; Type: CONSTRAINT; Schema: public; Owner: thrift
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_unique UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: thrift
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: cache_expiration_index; Type: INDEX; Schema: public; Owner: thrift
--

CREATE INDEX cache_expiration_index ON public.cache USING btree (expiration);


--
-- Name: cache_locks_expiration_index; Type: INDEX; Schema: public; Owner: thrift
--

CREATE INDEX cache_locks_expiration_index ON public.cache_locks USING btree (expiration);


--
-- Name: jobs_queue_index; Type: INDEX; Schema: public; Owner: thrift
--

CREATE INDEX jobs_queue_index ON public.jobs USING btree (queue);


--
-- Name: personal_access_tokens_expires_at_index; Type: INDEX; Schema: public; Owner: thrift
--

CREATE INDEX personal_access_tokens_expires_at_index ON public.personal_access_tokens USING btree (expires_at);


--
-- Name: personal_access_tokens_tokenable_type_tokenable_id_index; Type: INDEX; Schema: public; Owner: thrift
--

CREATE INDEX personal_access_tokens_tokenable_type_tokenable_id_index ON public.personal_access_tokens USING btree (tokenable_type, tokenable_id);


--
-- Name: sessions_last_activity_index; Type: INDEX; Schema: public; Owner: thrift
--

CREATE INDEX sessions_last_activity_index ON public.sessions USING btree (last_activity);


--
-- Name: sessions_user_id_index; Type: INDEX; Schema: public; Owner: thrift
--

CREATE INDEX sessions_user_id_index ON public.sessions USING btree (user_id);


--
-- Name: audit_log audit_log_admin_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: thrift
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_admin_id_foreign FOREIGN KEY (admin_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: listings listings_interested_buyer_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: thrift
--

ALTER TABLE ONLY public.listings
    ADD CONSTRAINT listings_interested_buyer_id_foreign FOREIGN KEY (interested_buyer_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: notifications notifications_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: thrift
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: payments payments_listing_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: thrift
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_listing_id_foreign FOREIGN KEY (listing_id) REFERENCES public.listings(listing_id) ON DELETE CASCADE;


--
-- Name: payments payments_seller_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: thrift
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_seller_id_foreign FOREIGN KEY (seller_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: listings products_category_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: thrift
--

ALTER TABLE ONLY public.listings
    ADD CONSTRAINT products_category_id_foreign FOREIGN KEY (category_id) REFERENCES public.categories(category_id) ON DELETE RESTRICT;


--
-- Name: listings products_seller_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: thrift
--

ALTER TABLE ONLY public.listings
    ADD CONSTRAINT products_seller_id_foreign FOREIGN KEY (seller_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: reports reports_reporter_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: thrift
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_reporter_id_foreign FOREIGN KEY (reporter_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: reviews reviews_buyer_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: thrift
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_buyer_id_foreign FOREIGN KEY (buyer_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: reviews reviews_listing_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: thrift
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_listing_id_foreign FOREIGN KEY (listing_id) REFERENCES public.listings(listing_id) ON DELETE CASCADE;


--
-- Name: reviews reviews_seller_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: thrift
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_seller_id_foreign FOREIGN KEY (seller_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 9hCNpu0w6Lmk9gzB538vsYUgO6sdihyV205mPs7hfGDcw8I6qMqV975wEn7Hj51

