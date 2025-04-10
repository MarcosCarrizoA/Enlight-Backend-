-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Dec 04, 2024 at 05:57 PM
-- Server version: 8.0.34
-- PHP Version: 8.2.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `enlight`
--

-- --------------------------------------------------------

--
-- Table structure for table `account`
--

CREATE TABLE `account` (
  `id` int NOT NULL,
  `email` varchar(60) DEFAULT NULL,
  `password` varchar(60) NOT NULL,
  `name` varchar(30) NOT NULL,
  `birthday` date NOT NULL,
  `address` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `account`
--

INSERT INTO `account` (`id`, `email`, `password`, `name`, `birthday`, `address`) VALUES
(15, 'pedroramirezneira@gmail.com', '$2b$10$NW4Go77w5atq4OzntnGxRe37oN/7qtXDBZJ17DreAqslYdAysrEhK', 'Pedro', '2004-01-10', 'Si'),
(16, 'mcarrizoaslanian@gmail.com', '$2b$10$3GxBtYPqrl7cX2kb2hDO6.K68uJhTrl8Pfs5c8PhZRAJLXORYt0Ha', 'marcos', '1985-12-01', 'si'),
(17, 'pramirezneira@mail.austral.edu.ar', '$2b$10$V3c0jKE02k9eHP2f/VvOGe7LHvH6zg6g.3RSwu47/ghOrw6TAsFx2', 'Pedro Ramirez Neira', '2004-01-10', 'Pedro\'s House'),
(19, 'maxsasysallemi+2@gmail.com', '$2b$10$wN.HMR6RC7C8PA/cHNKXr.5IsXGlodGHqhVCWZFj6bQVfBNf1ZKSm', 'sasi2', '2003-10-07', 'Pardo 3304'),
(21, 'iacovonebru@gmail.com', '$2b$10$8iyTPratZKSujDtlkAK4Te.Bc4b8ldwfPK9Cjb0jESpubwp8DCDOW', 'bruno', '2004-02-03', 'hola'),
(22, 'pbaratta@mail.austral.edu.ar', '$2b$10$Q3KzG8hyamaLctuRJpt8SOaaC2QRQkxnv3uB4DWJFjhVNTx331Tqq', 'Naruto', '2000-12-01', 'mi casa'),
(23, 'teacher@demo.com', '$2b$10$iGrr3/fEW8Fd8k/yF2tuquQuXJiaefxhlJjVRBLrLFnw7j76YhulW', 'Teacher', '2003-12-01', 'Teacher\'s House'),
(24, 'student@demo.com', '$2b$10$rfdbVm8cnk.pHW40EqcQguBpopIbCvWfgtdBN60gLgKpa9X.t60xu', 'Student', '2000-12-27', 'Student\'s House'),
(25, 'si@si.com', '$2b$10$EEaewtDH1DsYyGwDcbmTS.QPRo9AWPD6EPWohz.GjnphFeZs7csmC', 'si', '2003-12-01', 'si'),
(26, 'pedro.ramirezneira@gmail.com', '$2b$10$81Bt1xTGoHTnPGmUybW6TenqASbO0ecSRouu3bmEsDlgS3KAx17Ji', 'Pedrooo', '2000-11-14', 'Pedro\'s House');

-- --------------------------------------------------------

--
-- Table structure for table `account_picture`
--

CREATE TABLE `account_picture` (
  `account_id` int NOT NULL,
  `picture_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `account_picture`
--

-- --------------------------------------------------------

--
-- Table structure for table `account_role`
--

CREATE TABLE `account_role` (
  `account_id` int NOT NULL,
  `role_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `account_role`
--

INSERT INTO `account_role` (`account_id`, `role_id`) VALUES
(15, 1),
(19, 1),
(21, 1),
(24, 1),
(16, 2),
(17, 2),
(22, 2),
(23, 2),
(25, 2),
(26, 2);

-- --------------------------------------------------------

--
-- Table structure for table `account_teacher`
--

CREATE TABLE `account_teacher` (
  `account_id` int NOT NULL,
  `teacher_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `account_teacher`
--

INSERT INTO `account_teacher` (`account_id`, `teacher_id`) VALUES
(16, 7),
(17, 8),
(22, 11),
(23, 12),
(25, 13),
(26, 14);

-- --------------------------------------------------------

--
-- Table structure for table `category`
--

CREATE TABLE `category` (
  `id` int NOT NULL,
  `name` varchar(60) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `category`
--

INSERT INTO `category` (`id`, `name`) VALUES
(2, 'Art & Design'),
(15, 'Business Studies'),
(5, 'Computer Science'),
(1, 'Cuisine'),
(12, 'Cultural Knowledge'),
(11, 'Economics'),
(4, 'Geography'),
(6, 'History'),
(10, 'Literature'),
(3, 'Mathematics'),
(7, 'Mechanics'),
(14, 'Medicine'),
(13, 'Other'),
(8, 'Philosophy'),
(9, 'Psychology');

-- --------------------------------------------------------

--
-- Table structure for table `category_subject`
--

CREATE TABLE `category_subject` (
  `category_id` int NOT NULL,
  `subject_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `category_subject`
--

INSERT INTO `category_subject` (`category_id`, `subject_id`) VALUES
(2, 1),
(15, 2),
(15, 3),
(5, 4),
(3, 7),
(13, 8),
(2, 10),
(3, 11),
(3, 12),
(3, 13),
(15, 14);

-- --------------------------------------------------------

--
-- Table structure for table `chat`
--

CREATE TABLE `chat` (
  `student_account_id` int NOT NULL,
  `teacher_account_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `chat`
--

INSERT INTO `chat` (`student_account_id`, `teacher_account_id`) VALUES
(15, 16),
(15, 17),
(19, 17),
(21, 17),
(15, 26),
(19, 26),
(24, 26);

-- --------------------------------------------------------

--
-- Table structure for table `class_modality`
--

CREATE TABLE `class_modality` (
  `id` int NOT NULL,
  `option` varchar(60) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `class_modality`
--

INSERT INTO `class_modality` (`id`, `option`) VALUES
(1, 'face-to-face'),
(2, 'online'),
(3, 'both');

-- --------------------------------------------------------

--
-- Table structure for table `date`
--

CREATE TABLE `date` (
  `id` int NOT NULL,
  `date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `date`
--

INSERT INTO `date` (`id`, `date`) VALUES
(6, '2024-11-20'),
(5, '2024-11-21'),
(3, '2024-11-22'),
(4, '2024-11-27'),
(1, '2024-11-28'),
(2, '2024-11-29'),
(8, '2024-12-02'),
(10, '2024-12-03'),
(11, '2024-12-04'),
(12, '2024-12-05'),
(15, '2024-12-06'),
(9, '2024-12-09'),
(14, '2024-12-10'),
(18, '2024-12-12'),
(16, '2024-12-13'),
(17, '2024-12-19'),
(13, '2024-12-24'),
(7, '2024-12-26');

-- --------------------------------------------------------

--
-- Table structure for table `day`
--

CREATE TABLE `day` (
  `id` int NOT NULL,
  `name` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `day`
--

INSERT INTO `day` (`id`, `name`) VALUES
(1, 'Monday'),
(2, 'Tuesday'),
(3, 'Wednesday'),
(4, 'Thursday'),
(5, 'Friday'),
(6, 'Saturday'),
(7, 'Sunday');

-- --------------------------------------------------------

--
-- Table structure for table `picture`
--

CREATE TABLE `picture` (
  `id` int NOT NULL,
  `picture` mediumblob NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `picture`
--

-- --------------------------------------------------------

--
-- Table structure for table `rating`
--

CREATE TABLE `rating` (
  `teacher_id` int NOT NULL,
  `rating` double NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `rating`
--

INSERT INTO `rating` (`teacher_id`, `rating`) VALUES
(4, 10),
(4, 10),
(4, 10),
(9, 3),
(9, 9),
(8, 9),
(8, 1),
(8, 7),
(8, 8),
(8, 10),
(8, 5),
(8, 10),
(14, 8);

-- --------------------------------------------------------

--
-- Table structure for table `refresh_token`
--

CREATE TABLE `refresh_token` (
  `id` int NOT NULL,
  `token` varchar(139) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `refresh_token`
--

INSERT INTO `refresh_token` (`id`, `token`) VALUES
(1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImlhdCI6MTczMjg0MDQ4OH0.eb7vY_tGnMMZUfVn5_bkWjMDfD-92YgIh8cgYE9I5oc'),
(2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImlhdCI6MTczMjg0MDk4Nn0.TznIa6dpkjAbEP1H3RLhCmsGgx4WhQR_PzxQq_v9dEU'),
(8, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImlhdCI6MTczMjkxODQ0N30.jA9xqXuIib8A_EfPr-jfaSrw7MJ5GoSciop7WRVnZtk'),
(9, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTEsImlhdCI6MTczMjkxODczOH0.Gcia9vESm0bTKd4WZJip4r2iirtn7RPYg0Mt5nHS5gs'),
(10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTEsImlhdCI6MTczMjkxOTYyMX0.guxv5eHDr63QCwFtFbvvoIqo8xzo7YaaIsTetLvEY8s'),
(11, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTEsImlhdCI6MTczMjkyMDM2N30.B4-0ulfA_-t6QD0DPHs99lRF0tBwroD9DV2OCzKYkDk'),
(12, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImlhdCI6MTczMjk4ODM2MH0.RuQYsIuwS6vFEIHI-YLaI6QzEsO5ytWUl6gpE9fZSDM'),
(13, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImlhdCI6MTczMjk5MDU5MX0.NV_rQPPN9gI3y2KmMamWc0g4tgVnpxq4lkqybtXiMO0'),
(14, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImlhdCI6MTczMjk5MDkwOH0.DLRv81k6BpaiwJ8X3rlsH0jRrJmUjdd7k9ybERAuYT0'),
(15, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImlhdCI6MTczMjk5MTMyNH0.W1dYHv57cFgillY81MuH1l5VPAhNk_0kdK2AHea0vhQ'),
(16, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImlhdCI6MTczMjk5MTc4MX0.mmDGFDm--QGxVwSEcvNTzFoh8pZ9KaIF-xvQ7m-vqt8'),
(17, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImlhdCI6MTczMjk5MzE1OH0.VSaSXKOtEexS6sPzNf-ieElDMsHsIPbSVCHO-oqpwQ8'),
(18, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImlhdCI6MTczMjk5MzYzMn0.oAj1OhrTc0rEVNDMaD0kJCmdOMamnQL7UIDzATxpDOU'),
(19, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImlhdCI6MTczMjk5NjEzOX0.V_bT01dPZNkJcquf7ZaKxTavqJBZn6knEXuUKk2PE6o'),
(20, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImlhdCI6MTczMjk5NjQ2Nn0.6feFfXPVlDftM21K8XeRNlN92T1V5L_VZzIemSsCsjE'),
(21, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImlhdCI6MTczMjk5NzA0MX0.94TWzTvY6dNqQWURzmiYaEgevXvV4pFCv97KONWdXQQ'),
(23, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTEsImlhdCI6MTczMjk5ODQ0Mn0.oG7vNA7PSmhcci1fxCP56OEDnN35hnVfQB04VywR7b8'),
(25, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTEsImlhdCI6MTczMzAwMTAxMX0.yNQbg7fbf3tvX7jF7_jhN0_K-iFJqh_xfXLlMpqyw78'),
(28, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImlhdCI6MTczMzAwOTc3NH0.gDQS3sHe1H4y90KDUAvkXxJt26Vho9rcs7125_p1cQk'),
(30, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTEsImlhdCI6MTczMzAxMjE2M30.-mf4kl_FhkQiCEgjRJac5xP4Buap0scgbVwHXWjXEfo'),
(31, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTEsImlhdCI6MTczMzAxMjI2OH0.y5tpnCwhHbNIa5C_XAVXO-H414GgcRCS9LJAJ0JlxoA'),
(34, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTEsImlhdCI6MTczMzAyMzA5NX0.QhmGN7GRBFA-ckoWfxq9U87zla2zR9QB5f1SNy30IhE'),
(37, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTEsImlhdCI6MTczMzAyMzg1NX0.s9GygpL9xLSef3I8uejTTjbP1X3zJOHI6YNLqy38wxs'),
(38, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImlhdCI6MTczMzAyMzk3Nn0.3QFPcGT4RThmW-hAUJW8CKFFai8_sso_qMjj5mwkO8Y'),
(39, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTEsImlhdCI6MTczMzAyNjA2MH0.WBcumZ3d_nFSt5_p1fc5gysQO4tco2ljs1iGgY02kFg'),
(41, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImlhdCI6MTczMzAyNjU0Nn0.X45X8SrbU_Sc7wG15q5GW1wPyjgaK2EinddwRYXAR1U'),
(43, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTEsImlhdCI6MTczMzAyODY3M30.0zo4xvXrHi3nvL3_xHJiVMmUN76rk-UIXWG6bVnGxMs'),
(45, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTEsImlhdCI6MTczMzAyODczNn0.OgTiL5z4GNzBHhjT3XDeFFAetCQaNlGUeDEGQ7QzHIg'),
(46, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImlhdCI6MTczMzAyOTA1M30.8HZx4-UBlR2rPbZhCssJID_u_iGQ5x88V1jSaAenVjk'),
(47, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImlhdCI6MTczMzAyOTQyNn0.J0cSQMTdVO_qdtJQS_H0UqJlCMhjqduQIyGupp0ck1w'),
(48, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImlhdCI6MTczMzA2MTIxNX0.IUs1hGNgnDA4nLf5LpN1ikyJ7s1t3bzPqr0fZjlr268'),
(49, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImlhdCI6MTczMzA3NzMzNn0.cWn5mZfjeLI2b79kzqhfu47JPFv8kDvJ8hM1rbqC754'),
(50, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImlhdCI6MTczMzA3NzUwMX0.JiPCnD4UPsAjj3xDwhbwTwUmo_iR1achMQ-Nk0PfQj8'),
(51, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTEsImlhdCI6MTczMzA4MjA5OH0.LXpbj5oswMPRSniRySAjSX5plwNsM0f5GTkCenzxwnQ'),
(52, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImlhdCI6MTczMzA4MjUwMn0.nmrnDGJB4497GmSb8QgpM7NDAFy3nd6Wixp9VBcpn8Y'),
(54, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImlhdCI6MTczMzA4NTg0NX0.E_5RMXY0G9qwq44hM0Zh2YtSjj6Kx-Bd9JXrkbVit2Y'),
(66, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImlhdCI6MTczMzA4OTgzNX0.KkySUwmzlE7CzlZHLcdwP3sIQrPCr8MLYCNIRGCp0a8'),
(70, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImlhdCI6MTczMzA5Mzc3OX0.cF-LrWvWribhgixYH8WRQEbo5T54J6ixEANtVSusRuw'),
(72, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImlhdCI6MTczMzA5NDQ0OX0.ib1s0LjTM4y7yD4-pAJWb93xBH2tHXKWu86uy2K_790'),
(74, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTEsImlhdCI6MTczMzA5NTE3MH0.UpZ-uZ1iW5927hudD0NX0HUB7dkXnP0yTK0HAQ34Hvc'),
(76, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTMsImlhdCI6MTczMzA5NjQzNX0.uDPz6qhD6yrAbpxDyi5ldc7TPZ6_dvjvc7KLkPUxFOw'),
(77, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTMsImlhdCI6MTczMzA5NjQ3M30.tgv6sRhmhPflP9g7WHb5eupLAXs6pLsGsM773CaGRzc'),
(84, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImlhdCI6MTczMzA5NzE0OX0.WGhJD6voickA99udEXihtmAafzgtHWtAF2GDb4fruyU'),
(85, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTUsImlhdCI6MTczMzA5ODA5M30.zvQP75Ec-wyVvXo1xfkklF6O3sfyk02DIqJN_PBcXnU'),
(86, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTUsImlhdCI6MTczMzA5ODMxNH0.59Dt20-ZpMWSxcu1S-f4bD6a04Aiqmg_kJHq_dshays'),
(87, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTYsImlhdCI6MTczMzA5ODcwMn0.utG0el4vzL90jl56e6riKHE5DQW9bnAuOstvFS2emhE'),
(90, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTUsImlhdCI6MTczMzA5ODkyNH0.hRCFjT5g3Ed_gJmjtN893jzTE6XSIaZeLz6Bwl-lhuk'),
(96, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTcsImlhdCI6MTczMzEyNDcyN30.ArRraJs0aIe-SbSwV8o6IwjNxHIsbYJrOL2XRSdpw8w'),
(97, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTcsImlhdCI6MTczMzEzNDI0NX0.Zu6A23gg6B9WgI2e5FnMTEYzPzrK48J5QkAwED0LKJE'),
(102, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTcsImlhdCI6MTczMzE0ODQzNn0.ur7tp7cEJUbisn52TrMYGN84l5TPE5SKJ6U5xKWIcEk'),
(111, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTgsImlhdCI6MTczMzE5MjgzOH0.je2L8kiysAK_OIgHLYitANTmnaQgPbABuTIYOiNsoGs'),
(119, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTksImlhdCI6MTczMzI0MDc3MH0.cgVY4_lbBlIjAHUedEc6kvLFc3Q-YFCaw3glOEen_X0'),
(120, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTksImlhdCI6MTczMzI0MTEzOH0.YDaWZyXHddniZXBl4bqXgV-C2KS19-JywI1rMMNGxao'),
(121, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTksImlhdCI6MTczMzI0MTMwOH0.xArhEbm7jyhwAaYv91AmrNVT8xrGasTxD1YcWSMaGRs'),
(122, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTksImlhdCI6MTczMzI0NzAwOX0._UBBaHnM5ahpVBOo3o_dJjdB9QbBV9bfa5B4hzegbxw'),
(123, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTcsImlhdCI6MTczMzI0ODc3Mn0.klgLwmZowlts-GfcoyNYScyIJ5fdmMHf5-5d9c2MMYA'),
(127, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTUsImlhdCI6MTczMzI2MTc5Nn0.ZjgUg-4iQ__U2LqOIprR_XcBhEr9WgaKg_cn43_eqek'),
(129, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjEsImlhdCI6MTczMzI2NzI2M30.Js7q26nuBXvY9xFRtGWJtdmYbW0lSutoLKbhQO9OTBM'),
(131, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTYsImlhdCI6MTczMzI3MzA3NX0.SaghltKhBbcZc0GJz95apO0gcAAgIPLcBK0H51R_TnE'),
(133, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTksImlhdCI6MTczMzI4MDQ0OH0.1RCXghi3WRL3B9t3EGc93H1Xi48MN74yhD9WjHLPHCQ'),
(137, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTksImlhdCI6MTczMzI4MTIxN30._8ZT6xvtfp4UzmhFATE1eTK8_i2ohQikc45N2VZTBZY'),
(138, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTUsImlhdCI6MTczMzI4MTU0MX0.pnqdvHu5uq5Am5s2Lrp16fur4guK44kKB8ekdyCUmp8'),
(141, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTksImlhdCI6MTczMzI4MzUwNH0.houj32qaETOwtVt8Dyo3InZL7NoZgoO-r9uZvMOucnU'),
(143, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTUsImlhdCI6MTczMzI4NDc4M30.kDejpdTGqlZ9Kvw53lOHK2WK3sHLFaIh8DnT9koWZRw'),
(144, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTUsImlhdCI6MTczMzI4NTA2M30.coMiqUBbMzvqUQbP06D0AXJ7mLSEAkLQb1WGWJlrgpE'),
(145, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTksImlhdCI6MTczMzI4NTIzNX0.XuHReFELiSQvhc09FArh9AhRL696r90X-yNxUDH-wJg'),
(146, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTUsImlhdCI6MTczMzI5MTEyOH0.JNzpPnJkli9hWCOp6gGmJ2Su6qOmJKJjdBm-EPmVUZA'),
(147, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTUsImlhdCI6MTczMzI5MjA5Nn0.WeyMmrHAdO9oJITaf0m35L9vEEhpUEH0j5FVXsXG7tk'),
(148, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTUsImlhdCI6MTczMzI5MjY1M30.KIuKXeGhSUEDNpzRKDRYYzCDVC2T8IRE1RreKvwYb5Q'),
(150, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTUsImlhdCI6MTczMzI5MzAyNn0.hAUBR2t108QwFiJJGIfkv3iCh2V3ytwkSuq0RBHbE7U'),
(151, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTUsImlhdCI6MTczMzI5MzQ3OX0.7YP7naSD83IYgv6EEyVzCKkBn2ffXpuw4dVNR-6Ub2Y'),
(155, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTUsImlhdCI6MTczMzI5NjQxN30.upibPDGhyhbqY77q6LZGPDJJggesK5F5iYvNE9eB9sM'),
(163, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjIsImlhdCI6MTczMzMxMjA5Mn0.I9Pl5AmE4Cw2QIsvzrSrvWvTsv7YkYV-w10vTul_hhw'),
(166, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTcsImlhdCI6MTczMzMxNDg5M30.aUraX1PL3NNsuoAe3z5jG7j71QAw3d1WPlB2w-1eCQY'),
(170, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjQsImlhdCI6MTczMzMxNjQ2Mn0.zQ9NQgNhTXZ6NfE2zhL0SCgUPGK06gOuo29-FIavyDc'),
(171, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTksImlhdCI6MTczMzMxNjUyOH0.bL2VgDbMdEtKc4sTnOtBgLcVx6a-BUkDeWZlIGPDLRE'),
(178, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjQsImlhdCI6MTczMzMxNzMwNX0.zyq17NTMaIJMD_X0Bc8WEruDYcjTQJ3CBgDEWmpRXpo'),
(182, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjYsImlhdCI6MTczMzMxODE0OH0.Dtx4ryRBFlkGW--z5heuFMREcNwZaN2o7pOt-i1r3D0'),
(183, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjYsImlhdCI6MTczMzMyNDk4MH0.78LGGEw6HBlrioLy6q5xI6tTXaW4WUnaak9I-oiz1Tw');

-- --------------------------------------------------------

--
-- Table structure for table `reservation`
--

CREATE TABLE `reservation` (
  `id` int NOT NULL,
  `account_id` int NOT NULL,
  `timeslot_id` int NOT NULL,
  `date_id` int NOT NULL,
  `modality` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `reservation`
--

INSERT INTO `reservation` (`id`, `account_id`, `timeslot_id`, `date_id`, `modality`) VALUES
(33, 10, 1, 8, 2),
(45, 21, 11, 13, 1),
(50, 19, 14, 15, 2),
(52, 19, 14, 16, 2),
(55, 15, 12, 11, 2),
(59, 15, 22, 11, 1),
(61, 15, 13, 12, 2),
(62, 19, 36, 14, 1),
(65, 15, 38, 12, 1),
(66, 24, 38, 12, 1),
(67, 19, 40, 12, 2),
(68, 24, 40, 12, 2),
(69, 24, 40, 18, 2);

-- --------------------------------------------------------

--
-- Table structure for table `role`
--

CREATE TABLE `role` (
  `id` int NOT NULL,
  `name` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `role`
--

INSERT INTO `role` (`id`, `name`) VALUES
(1, 'student'),
(2, 'teacher');

-- --------------------------------------------------------

--
-- Table structure for table `subject`
--

CREATE TABLE `subject` (
  `id` int NOT NULL,
  `name` varchar(60) NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `price` int NOT NULL,
  `size` int NOT NULL,
  `modality` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `subject`
--

INSERT INTO `subject` (`id`, `name`, `description`, `price`, `size`, `modality`) VALUES
(1, '3d Art', 'Learn to build awesome things!', 100, 5, 3),
(2, 'Test', 'hola', 10, 1, 1),
(3, 'si', 'si', 100, 1, 3),
(4, 'Programación 1', 'Conceptos básicos de python, utilizando el paradigma de programación de objetos.', 1000, 10, 3),
(7, 'Complex Analysis', 'The theory of functions of a complex variable.', 300, 1, 2),
(8, 'Reino de hongos', 'En biología, los hongos (nombre científico: Fungi; plural latino de fungus, lit. «hongos»)5​6​ conforman un taxón o grupo de organismos eucarióticos7​ entre los que se encuentran los mohos, las levaduras y los organismos productores de setas. Están clasificados en un reino distinto al de las plantas, animales, protozoos y cromistas. Se distinguen de las plantas en que son heterótrofos;8​ y de los animales en que poseen paredes celulares, como las plantas, compuestas por quitina, en vez de celulosa. Es el reino de la naturaleza más cercano filogenéticamente a los animales (Animalia).9​ Sus adjetivos son: «fúngico» y «fungoso».7​', 10000, 31, 1),
(10, '3d Art', 'Learn to build amazing things!', 2000, 1, 1),
(11, 'Álgebra 1', 'Álgebra lineal y matrices', 500, 7, 3),
(12, 'calc', 'si', 300, 1, 2),
(13, 'Analisis 2', 'Aprende matematica', 1500, 5, 1),
(14, 'Negocios', 'Aprende a negociar', 1000, 2, 2);

-- --------------------------------------------------------

--
-- Table structure for table `teacher`
--

CREATE TABLE `teacher` (
  `id` int NOT NULL,
  `description` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `teacher`
--

INSERT INTO `teacher` (`id`, `description`) VALUES
(4, 'me llamo joaco, pero vos podes llamarme el amor de tu vida puta'),
(5, 'siiii'),
(6, ''),
(7, ''),
(8, 'Me gusta mucho enseñar'),
(9, ''),
(10, 'Una perra exclusive\nLe gustan las burbuja\', champán en el jacuzzi\nUna loca fancy, mala pero cutie\nNo existe nadie con permiso pa\' ese booty'),
(11, ''),
(12, ''),
(13, ''),
(14, '');

-- --------------------------------------------------------

--
-- Table structure for table `teacher_subject`
--

CREATE TABLE `teacher_subject` (
  `teacher_id` int NOT NULL,
  `subject_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `teacher_subject`
--

INSERT INTO `teacher_subject` (`teacher_id`, `subject_id`) VALUES
(4, 1),
(4, 2),
(6, 3),
(8, 4),
(9, 7),
(10, 8),
(8, 10),
(8, 11),
(13, 12),
(14, 13),
(14, 14);

-- --------------------------------------------------------

--
-- Table structure for table `time`
--

CREATE TABLE `time` (
  `id` int NOT NULL,
  `time` time NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `time`
--

INSERT INTO `time` (`id`, `time`) VALUES
(1, '17:00:00'),
(2, '19:00:00'),
(3, '17:47:00'),
(4, '18:47:00'),
(5, '17:48:00'),
(6, '18:48:00'),
(7, '17:50:00'),
(8, '18:50:00'),
(9, '17:53:00'),
(10, '18:53:00'),
(11, '14:00:00'),
(12, '15:00:00'),
(13, '12:50:00'),
(14, '16:50:00'),
(15, '09:00:00'),
(16, '11:00:00'),
(17, '12:31:00'),
(18, '01:31:00'),
(19, '10:33:00'),
(20, '10:34:00'),
(21, '12:45:00'),
(22, '13:45:00'),
(23, '17:20:00'),
(24, '19:20:00'),
(25, '09:45:00'),
(26, '11:45:00'),
(27, '04:00:00'),
(28, '05:00:00'),
(29, '08:00:00'),
(30, '10:00:00'),
(31, '12:00:00'),
(32, '09:40:00'),
(33, '09:40:00');

-- --------------------------------------------------------

--
-- Table structure for table `timeslot`
--

CREATE TABLE `timeslot` (
  `id` int NOT NULL,
  `subject_id` int NOT NULL,
  `day_id` int NOT NULL,
  `start_time_id` int NOT NULL,
  `end_time_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `timeslot`
--

INSERT INTO `timeslot` (`id`, `subject_id`, `day_id`, `start_time_id`, `end_time_id`) VALUES
(1, 1, 1, 1, 2),
(2, 1, 2, 1, 2),
(3, 1, 3, 1, 2),
(5, 1, 4, 1, 2),
(4, 1, 5, 1, 2),
(6, 2, 3, 11, 12),
(7, 2, 4, 11, 12),
(8, 2, 5, 11, 12),
(9, 3, 3, 13, 14),
(10, 4, 1, 15, 16),
(11, 4, 2, 15, 16),
(12, 4, 3, 15, 16),
(13, 4, 4, 15, 16),
(14, 4, 5, 15, 16),
(17, 7, 1, 21, 22),
(18, 8, 1, 23, 24),
(19, 8, 4, 23, 24),
(22, 10, 3, 27, 28),
(23, 10, 4, 27, 28),
(24, 10, 5, 27, 28),
(29, 11, 1, 29, 30),
(30, 11, 1, 30, 31),
(25, 11, 2, 29, 30),
(26, 11, 3, 29, 30),
(27, 11, 3, 30, 31),
(28, 11, 4, 29, 30),
(31, 11, 5, 29, 30),
(32, 12, 1, 32, 33),
(33, 12, 3, 32, 32),
(34, 13, 1, 15, 30),
(35, 13, 1, 30, 16),
(36, 13, 2, 15, 30),
(37, 13, 3, 15, 30),
(38, 13, 4, 15, 30),
(39, 14, 3, 16, 31),
(40, 14, 4, 16, 31);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `account`
--
ALTER TABLE `account`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `account_picture`
--
ALTER TABLE `account_picture`
  ADD UNIQUE KEY `account_id` (`account_id`),
  ADD UNIQUE KEY `picture_id` (`picture_id`);

--
-- Indexes for table `account_role`
--
ALTER TABLE `account_role`
  ADD UNIQUE KEY `account_id` (`account_id`,`role_id`),
  ADD KEY `account_role_ibfk_2` (`role_id`);

--
-- Indexes for table `account_teacher`
--
ALTER TABLE `account_teacher`
  ADD UNIQUE KEY `account_id` (`account_id`,`teacher_id`),
  ADD KEY `teacher_id` (`teacher_id`);

--
-- Indexes for table `category`
--
ALTER TABLE `category`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `category_pk` (`name`);

--
-- Indexes for table `category_subject`
--
ALTER TABLE `category_subject`
  ADD UNIQUE KEY `category_id` (`category_id`,`subject_id`),
  ADD KEY `subject_id` (`subject_id`);

--
-- Indexes for table `chat`
--
ALTER TABLE `chat`
  ADD UNIQUE KEY `student_account_id` (`student_account_id`,`teacher_account_id`),
  ADD KEY `teacher_account_id` (`teacher_account_id`);

--
-- Indexes for table `class_modality`
--
ALTER TABLE `class_modality`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `date`
--
ALTER TABLE `date`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `date` (`date`);

--
-- Indexes for table `day`
--
ALTER TABLE `day`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `picture`
--
ALTER TABLE `picture`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `rating`
--
ALTER TABLE `rating`
  ADD KEY `rating_teacher_id_fk` (`teacher_id`);

--
-- Indexes for table `refresh_token`
--
ALTER TABLE `refresh_token`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `reservation`
--
ALTER TABLE `reservation`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reservations_account_id_fk` (`account_id`),
  ADD KEY `reservations_class_modality_id_fk` (`modality`),
  ADD KEY `reservations_date_id_fk` (`date_id`),
  ADD KEY `reservations_timeslot_id_fk` (`timeslot_id`);

--
-- Indexes for table `role`
--
ALTER TABLE `role`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `subject`
--
ALTER TABLE `subject`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `teacher`
--
ALTER TABLE `teacher`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `teacher_subject`
--
ALTER TABLE `teacher_subject`
  ADD UNIQUE KEY `teacher_id` (`teacher_id`,`subject_id`),
  ADD KEY `subject_id` (`subject_id`);

--
-- Indexes for table `time`
--
ALTER TABLE `time`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `timeslot`
--
ALTER TABLE `timeslot`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `subject_id` (`subject_id`,`day_id`,`start_time_id`,`end_time_id`),
  ADD KEY `day_id` (`day_id`),
  ADD KEY `timeslot_ibfk_3` (`start_time_id`),
  ADD KEY `timeslot_ibfk_4` (`end_time_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `account`
--
ALTER TABLE `account`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `category`
--
ALTER TABLE `category`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `date`
--
ALTER TABLE `date`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `day`
--
ALTER TABLE `day`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `picture`
--
ALTER TABLE `picture`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `refresh_token`
--
ALTER TABLE `refresh_token`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=184;

--
-- AUTO_INCREMENT for table `reservation`
--
ALTER TABLE `reservation`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=70;

--
-- AUTO_INCREMENT for table `role`
--
ALTER TABLE `role`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `subject`
--
ALTER TABLE `subject`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `teacher`
--
ALTER TABLE `teacher`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `time`
--
ALTER TABLE `time`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `timeslot`
--
ALTER TABLE `timeslot`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `account_picture`
--
ALTER TABLE `account_picture`
  ADD CONSTRAINT `account_picture_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `account` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  ADD CONSTRAINT `account_picture_ibfk_2` FOREIGN KEY (`picture_id`) REFERENCES `picture` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

--
-- Constraints for table `account_role`
--
ALTER TABLE `account_role`
  ADD CONSTRAINT `account_role_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `account` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  ADD CONSTRAINT `account_role_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

--
-- Constraints for table `account_teacher`
--
ALTER TABLE `account_teacher`
  ADD CONSTRAINT `account_teacher_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `account` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  ADD CONSTRAINT `account_teacher_ibfk_2` FOREIGN KEY (`teacher_id`) REFERENCES `teacher` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

--
-- Constraints for table `category_subject`
--
ALTER TABLE `category_subject`
  ADD CONSTRAINT `category_subject_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  ADD CONSTRAINT `category_subject_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subject` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

--
-- Constraints for table `chat`
--
ALTER TABLE `chat`
  ADD CONSTRAINT `chat_ibfk_1` FOREIGN KEY (`student_account_id`) REFERENCES `account` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  ADD CONSTRAINT `chat_ibfk_2` FOREIGN KEY (`teacher_account_id`) REFERENCES `account` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

--
-- Constraints for table `rating`
--
ALTER TABLE `rating`
  ADD CONSTRAINT `rating_teacher_id_fk` FOREIGN KEY (`teacher_id`) REFERENCES `teacher` (`id`);

--
-- Constraints for table `reservation`
--
ALTER TABLE `reservation`
  ADD CONSTRAINT `reservations_class_modality_id_fk` FOREIGN KEY (`modality`) REFERENCES `class_modality` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  ADD CONSTRAINT `reservations_date_id_fk` FOREIGN KEY (`date_id`) REFERENCES `date` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  ADD CONSTRAINT `reservations_timeslot_id_fk` FOREIGN KEY (`timeslot_id`) REFERENCES `timeslot` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

--
-- Constraints for table `teacher_subject`
--
ALTER TABLE `teacher_subject`
  ADD CONSTRAINT `teacher_subject_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `teacher` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  ADD CONSTRAINT `teacher_subject_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subject` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

--
-- Constraints for table `timeslot`
--
ALTER TABLE `timeslot`
  ADD CONSTRAINT `timeslot_ibfk_1` FOREIGN KEY (`subject_id`) REFERENCES `subject` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  ADD CONSTRAINT `timeslot_ibfk_2` FOREIGN KEY (`day_id`) REFERENCES `day` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  ADD CONSTRAINT `timeslot_ibfk_3` FOREIGN KEY (`start_time_id`) REFERENCES `time` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  ADD CONSTRAINT `timeslot_ibfk_4` FOREIGN KEY (`end_time_id`) REFERENCES `time` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
