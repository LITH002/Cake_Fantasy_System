-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 21, 2025 at 03:50 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `cake_fantasy_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin_users`
--

CREATE TABLE `admin_users` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `role` enum('employee','owner') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admin_users`
--

INSERT INTO `admin_users` (`id`, `username`, `email`, `password`, `first_name`, `last_name`, `role`, `created_at`, `updated_at`) VALUES
(1, 'admin', 'admin@cakefantasy.com', '$2b$10$60T27KPuFNkT2y1eI.uXYeD.38X1xsBIVI2D5A8/P18wuo.kYcBFW', 'Admin', 'User', 'owner', '2025-05-15 22:04:37', '2025-05-15 22:04:37'),
(2, 'Admin 2', 'nialntha@gmail.com', '$2b$10$2EwHeEal17SXaW0VZ2KOpuCuUIQnze7at7fpLZAMpdK8ABwOzKbjm', 'Nilantha', 'Vishwanath', '', '2025-05-20 21:54:49', '2025-05-20 21:54:49'),
(4, 'Emp1', 'dul@gmail.com', '$2b$10$HDYEdGFlP2RB0PwV3w4eouJFw0OBoQ98Q9wDNnZETOh7249vdTPlq', 'Dulani', 'Ramanayake', 'employee', '2025-05-20 21:56:51', '2025-05-20 21:56:51');

-- --------------------------------------------------------

--
-- Table structure for table `grn_details`
--

CREATE TABLE `grn_details` (
  `id` int(11) NOT NULL,
  `grn_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `expected_quantity` int(11) NOT NULL,
  `received_quantity` int(11) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `selling_price` decimal(10,2) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `batch_number` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `item_barcode` varchar(50) DEFAULT NULL,
  `unit` varchar(50) DEFAULT 'piece'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `grn_details`
--

INSERT INTO `grn_details` (`id`, `grn_id`, `item_id`, `expected_quantity`, `received_quantity`, `unit_price`, `selling_price`, `expiry_date`, `batch_number`, `notes`, `item_barcode`, `unit`) VALUES
(10, 8, 74, 5, 5, 90.00, 120.00, NULL, NULL, NULL, NULL, 'piece'),
(11, 9, 74, 15, 15, 90.00, 120.00, NULL, NULL, NULL, NULL, 'piece'),
(12, 9, 76, 10, 10, 290.00, 360.00, NULL, NULL, NULL, NULL, 'piece'),
(13, 10, 74, 1, 1, 90.00, 125.00, NULL, NULL, NULL, NULL, 'piece'),
(14, 10, 75, 24, 24, 350.00, 400.00, NULL, NULL, NULL, NULL, 'piece'),
(15, 12, 78, 1, 1, 125.00, 125.00, NULL, NULL, NULL, 'ING-001-292314', 'piece'),
(16, 13, 85, 16, 16, 190.00, 289.99, NULL, NULL, NULL, 'PRTY-001-450936', 'piece'),
(17, 14, 86, 7, 7, 140.00, 239.99, NULL, NULL, NULL, 'TOOL-004-587096', 'piece'),
(18, 15, 83, 15, 15, 260.00, 260.00, NULL, NULL, NULL, 'TOOL-002-682610', 'piece'),
(19, 16, 78, 16, 16, 125.00, 125.00, NULL, NULL, NULL, 'ING-001-292314', 'piece'),
(20, 17, 84, 2, 2, 250.00, 250.00, NULL, NULL, NULL, 'TOOL-003-033249', 'piece'),
(21, 19, 82, 2, 2, 950.00, 1000.00, NULL, NULL, NULL, 'ING-004-567763', 'piece'),
(22, 20, 82, 2000, 2000, 0.90, 1.00, NULL, NULL, NULL, 'ING-004-567763', 'g');

-- --------------------------------------------------------

--
-- Table structure for table `grn_headers`
--

CREATE TABLE `grn_headers` (
  `id` int(11) NOT NULL,
  `grn_number` varchar(50) NOT NULL,
  `supplier_id` int(11) NOT NULL,
  `po_reference` varchar(100) DEFAULT NULL,
  `received_date` date NOT NULL,
  `received_by` int(11) NOT NULL,
  `notes` text DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_by` int(11) DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `grn_headers`
--

INSERT INTO `grn_headers` (`id`, `grn_number`, `supplier_id`, `po_reference`, `received_date`, `received_by`, `notes`, `total_amount`, `created_at`, `updated_at`, `updated_by`, `status`) VALUES
(8, 'GRN-250518-001', 3, '890', '2025-05-18', 1, NULL, 450.00, '2025-05-18 20:29:22', '2025-05-18 20:29:22', NULL, 'pending'),
(9, 'GRN-250518-002', 6, '2', '2025-05-16', 1, 'bla bla', 4250.00, '2025-05-18 20:35:24', '2025-05-18 20:35:24', NULL, 'pending'),
(10, 'GRN-250519-003', 3, '01', '2025-05-19', 1, NULL, 8490.00, '2025-05-19 06:54:08', '2025-05-19 06:54:08', NULL, 'pending'),
(12, 'GRN-250520-001', 7, '07', '2025-05-20', 1, NULL, 125.00, '2025-05-20 17:41:31', '2025-05-20 17:41:31', NULL, 'pending'),
(13, 'GRN-250520-002', 6, '890', '2025-05-20', 1, 'no', 3040.00, '2025-05-20 18:11:00', '2025-05-20 18:11:00', NULL, 'pending'),
(14, 'GRN-250520-003', 3, '4', '2025-05-20', 1, 'no', 980.00, '2025-05-20 18:12:32', '2025-05-20 18:12:32', NULL, 'pending'),
(15, 'GRN-250520-004', 6, '01', '2025-05-20', 1, NULL, 3900.00, '2025-05-20 18:13:55', '2025-05-20 18:13:55', NULL, 'pending'),
(16, 'GRN-250520-005', 7, '5', '2025-05-20', 1, NULL, 2000.00, '2025-05-20 18:15:26', '2025-05-20 18:15:26', NULL, 'pending'),
(17, 'GRN-250520-006', 8, '01', '2025-05-20', 1, NULL, 500.00, '2025-05-20 18:17:48', '2025-05-20 18:17:48', NULL, 'pending'),
(19, 'GRN-250520-007', 9, '8', '2025-05-20', 1, NULL, 1900.00, '2025-05-20 19:26:43', '2025-05-20 19:26:43', NULL, 'pending'),
(20, 'GRN-250520-008', 9, '07', '2025-05-20', 1, NULL, 1800.00, '2025-05-20 20:15:07', '2025-05-20 20:15:07', NULL, 'pending'),
(21, 'GRN-250520-009', 9, '07', '2025-05-20', 1, NULL, 1800.00, '2025-05-20 20:17:43', '2025-05-20 20:17:43', NULL, 'pending');

-- --------------------------------------------------------

--
-- Table structure for table `items`
--

CREATE TABLE `items` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL COMMENT 'Cloudinary URL',
  `cloudinary_id` varchar(255) DEFAULT NULL COMMENT 'Cloudinary public ID for image management',
  `category` varchar(255) NOT NULL,
  `disabled` tinyint(1) DEFAULT 0,
  `sku` varchar(50) DEFAULT NULL COMMENT 'Stock Keeping Unit',
  `barcode` varchar(50) DEFAULT NULL COMMENT 'Item barcode if available',
  `stock_quantity` decimal(10,3) DEFAULT 0.000,
  `reorder_level` int(11) DEFAULT 5 COMMENT 'Min quantity before reordering',
  `cost_price` decimal(10,2) DEFAULT NULL COMMENT 'Purchase cost price',
  `selling_price` decimal(10,2) DEFAULT NULL,
  `unit` varchar(20) DEFAULT NULL COMMENT 'Unit of measurement (kg, g, piece, etc)',
  `is_loose` tinyint(1) DEFAULT 0,
  `min_order_quantity` decimal(10,3) DEFAULT 1.000,
  `increment_step` decimal(10,3) DEFAULT 1.000,
  `weight_value` decimal(10,3) DEFAULT NULL,
  `weight_unit` enum('g','ml') DEFAULT NULL,
  `pieces_per_pack` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `items`
--

INSERT INTO `items` (`id`, `name`, `description`, `image`, `cloudinary_id`, `category`, `disabled`, `sku`, `barcode`, `stock_quantity`, `reorder_level`, `cost_price`, `selling_price`, `unit`, `is_loose`, `min_order_quantity`, `increment_step`, `weight_value`, `weight_unit`, `pieces_per_pack`) VALUES
(78, 'Dum-Dum Baking Powder 50g', '', 'https://res.cloudinary.com/dqhdsyaqo/image/upload/v1747645296/cake-fantasy/hmatpqtgmplyvfipvmi3.png', 'cake-fantasy/hmatpqtgmplyvfipvmi3', 'Cake Ingredients', 0, 'ING-001-292314', NULL, 17.000, 5, 125.00, 125.00, 'piece', 0, 1.000, 1.000, NULL, 'g', NULL),
(79, 'dsftehry', '', 'https://res.cloudinary.com/dqhdsyaqo/image/upload/v1747645932/cake-fantasy/vdh9hcnogzuvcv0oglgk.png', 'cake-fantasy/vdh9hcnogzuvcv0oglgk', 'Cake Ingredients', 1, 'ING-002-928756', NULL, 0.000, 5, 560.00, 560.00, NULL, 0, 1.000, 1.000, NULL, NULL, NULL),
(80, 'Silicon Spatula', 'Long lasting', 'https://res.cloudinary.com/dqhdsyaqo/image/upload/v1747646165/cake-fantasy/vqb5g53azovx2hmoaigx.png', 'cake-fantasy/vqb5g53azovx2hmoaigx', 'Cake Tools', 1, 'TOOL-002-162782', NULL, 0.000, 5, 270.00, 270.00, 'piece', 0, 1.000, 1.000, NULL, 'g', NULL),
(81, 'Glucose Syrup', '500ml', 'https://res.cloudinary.com/dqhdsyaqo/image/upload/v1747648367/cake-fantasy/ixtwscvfrr6cefn2u1g6.png', 'cake-fantasy/ixtwscvfrr6cefn2u1g6', 'Cake Ingredients', 0, 'ING-003-363609', NULL, 0.000, 5, 450.00, 450.00, NULL, 0, 1.000, 1.000, NULL, NULL, NULL),
(82, 'Baking Powder', '', 'https://res.cloudinary.com/dqhdsyaqo/image/upload/v1747659570/cake-fantasy/k4fvjtu2fp2mzx1o8ir4.png', 'cake-fantasy/k4fvjtu2fp2mzx1o8ir4', 'Cake Ingredients', 0, 'ING-004-567763', NULL, 2002.000, 5, 0.90, 1.00, 'g', 0, 25.000, 10.000, 1000.000, 'g', NULL),
(83, 'Silicon Spatula', '', 'https://res.cloudinary.com/dqhdsyaqo/image/upload/v1747659685/cake-fantasy/q5eenj8kwzoqslpawexx.png', 'cake-fantasy/q5eenj8kwzoqslpawexx', 'Cake Tools', 0, 'TOOL-002-682610', NULL, 15.000, 5, 260.00, 260.00, 'piece', 1, 1.000, 1.000, NULL, NULL, 4),
(84, 'Silicon Mat', '', 'https://res.cloudinary.com/dqhdsyaqo/image/upload/v1747760033/cake-fantasy/ympeipatscpp1gkx4kat.png', 'cake-fantasy/ympeipatscpp1gkx4kat', 'Cake Tools', 0, 'TOOL-003-033249', NULL, 2.000, 5, 250.00, 250.00, 'piece', 0, 1.000, 1.000, NULL, NULL, 1),
(85, 'HBD Banner', 'happy birthday banner', 'https://res.cloudinary.com/dqhdsyaqo/image/upload/v1747764452/cake-fantasy/ssbujmlo0zgrj9qozb8x.png', 'cake-fantasy/ssbujmlo0zgrj9qozb8x', 'Party Items', 0, 'PRTY-001-450936', NULL, 16.000, 5, 190.00, 289.99, 'piece', 0, 1.000, 1.000, NULL, NULL, NULL),
(86, 'HBD candle', 'happy birthday candle', 'https://res.cloudinary.com/dqhdsyaqo/image/upload/v1747764588/cake-fantasy/smksrjqdrrldfqyfjqzf.png', 'cake-fantasy/smksrjqdrrldfqyfjqzf', 'Cake Tools', 0, 'TOOL-004-587096', NULL, 7.000, 5, 140.00, 239.99, 'piece', 0, 1.000, 1.000, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `address` text NOT NULL,
  `status` varchar(50) DEFAULT 'Item Processing',
  `payment` tinyint(1) DEFAULT 0,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `contact_number1` varchar(20) NOT NULL,
  `contact_number2` varchar(20) DEFAULT NULL,
  `special_instructions` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `user_id`, `amount`, `address`, `status`, `payment`, `first_name`, `last_name`, `contact_number1`, `contact_number2`, `special_instructions`, `created_at`, `updated_at`) VALUES
(14, 3, 1130.00, ', \n                                , \n                                කැස්බැව, \n                                10306, Colombo, Western, Sri Lanka', 'Item Processing', 0, 'Lithmi', 'Kihansa', '0706761613', '0773047749', 'bla bla', '2025-05-10 19:22:43', '2025-05-11 10:35:35'),
(15, 3, 830.00, ', \n                                , \n                                කැස්බැව, \n                                10306, Colombo, Western, Sri Lanka', 'Item Processing', 0, 'Lithmi', 'Kihansa', '0706761613', NULL, NULL, '2025-05-10 19:27:35', '2025-05-11 10:35:35'),
(16, 3, 830.00, ', \n                                , \n                                කැස්බැව, \n                                10306, Colombo, Western, Sri Lanka', 'Item Processing', 0, 'Lithmi', 'Kihansa', '0706761613', '0773047749', 'bla bla', '2025-05-10 19:27:45', '2025-05-11 10:35:35'),
(17, 3, 830.00, ', \n                                , \n                                කැස්බැව, \n                                10306, Colombo, Western, Sri Lanka', 'Item Processing', 0, 'Lithmi', 'Kihansa', '0706761613', '0773047749', 'bla bla', '2025-05-10 19:27:58', '2025-05-11 10:35:35'),
(18, 3, 830.00, ', \n                                , \n                                කැස්බැව, \n                                10306, Colombo, Western, Sri Lanka', 'Item Processing', 0, 'Lithmi', 'Kihansa', '0706761613', '0773047749', 'bla bla', '2025-05-10 19:28:12', '2025-05-11 10:35:35'),
(19, 3, 830.00, ', \n                                , \n                                කැස්බැව, \n                                10306, Colombo, Western, Sri Lanka', 'Item Processing', 0, 'Lithmi', 'Kihansa', '0706761613', NULL, NULL, '2025-05-10 19:38:53', '2025-05-11 10:35:35'),
(20, 3, 830.00, ', \n                                , \n                                කැස්බැව, \n                                10306, Colombo, Western, Sri Lanka', 'Item Processing', 0, 'Lithmi', 'Kihansa', '0706761613', NULL, NULL, '2025-05-10 19:39:55', '2025-05-11 10:35:35'),
(21, 3, 830.00, ', \n                                , \n                                Kuswala, \n                                11400, Colombo, Western, Sri Lanka', 'Item Processing', 0, 'Lithmi', 'Kihansa', '0706761613', NULL, NULL, '2025-05-10 19:41:50', '2025-05-11 10:35:35'),
(22, 3, 830.00, ', \n                                , \n                                Kuswala, \n                                11400, Colombo, Western, Sri Lanka', 'Item Processing', 0, 'Lithmi', 'Kihansa', '0706761613', NULL, NULL, '2025-05-10 19:44:07', '2025-05-11 10:35:35'),
(23, 3, 830.00, ', \n                                , \n                                Kuswala, \n                                11400, Colombo, Western, Sri Lanka', 'Item Processing', 0, 'Lithmi', 'Kihansa', '0706761613', '0773047749', 'bla bla', '2025-05-10 19:44:16', '2025-05-11 10:35:35'),
(24, 3, 830.00, ', \n                                , \n                                Kuswala, \n                                11400, Colombo, Western, Sri Lanka', 'Item Processing', 0, 'Lithmi', 'Kihansa', '0706761613', '0773047749', 'bla bla', '2025-05-10 19:45:04', '2025-05-11 10:35:35'),
(25, 3, 830.00, ', \n                                , \n                                Kuswala, \n                                11400, Colombo, Western, Sri Lanka', 'Item Processing', 0, 'Lithmi', 'Kihansa', '0706761613', '0773047749', 'bla bla', '2025-05-10 19:45:07', '2025-05-11 10:35:35'),
(26, 3, 830.00, ', \n                                , \n                                Kuswala, \n                                11400, Colombo, Western, Sri Lanka', 'Item Processing', 0, 'Lithmi', 'Kihansa', '0706761613', '0773047749', 'bla bla', '2025-05-10 19:45:39', '2025-05-11 10:35:35'),
(27, 3, 830.00, ', \n                                , \n                                Kuswala, \n                                11400, Colombo, Western, Sri Lanka', 'Item Processing', 0, 'Lithmi', 'Kihansa', '0706761613', '0773047749', 'bla bla', '2025-05-10 19:46:17', '2025-05-11 10:35:35'),
(28, 3, 935.00, 'D. R. Wijewardene Mawatha , \n                                Suduwella, \n                                Colombo, \n                                00200, Colombo, Western, Sri Lanka', 'Item Processing', 0, 'Lithmi', 'Kihansa', '0706761613', NULL, NULL, '2025-05-11 03:11:17', '2025-05-11 10:35:35'),
(29, 3, 830.00, 'D. R. Wijewardene Mawatha , \n                                Suduwella, \n                                Colombo, \n                                00200, Colombo, Western, Sri Lanka', 'Item Processing', 0, 'Lithmi', 'Kihansa', '0706761613', NULL, NULL, '2025-05-11 03:16:58', '2025-05-11 10:35:35'),
(30, 3, 830.00, 'D. R. Wijewardene Mawatha , \n                                Suduwella, \n                                Colombo, \n                                00200, Colombo, Western, Sri Lanka', 'Item Processing', 0, 'Lithmi', 'Kihansa', '0706761613', NULL, NULL, '2025-05-11 03:18:51', '2025-05-11 10:35:35'),
(31, 3, 830.00, 'D. R. Wijewardene Mawatha , \n                                Suduwella, \n                                Colombo, \n                                00200, Colombo, Western, Sri Lanka', 'Item Processing', 0, 'Lithmi', 'Kihansa', '0706761613', NULL, NULL, '2025-05-11 03:19:20', '2025-05-11 10:35:35'),
(32, 3, 830.00, ', \n                                , \n                                Kuswala, \n                                11400, Colombo, Western, Sri Lanka', 'Item Processing', 0, 'Lithmi', 'Kihansa', '0706761613', NULL, NULL, '2025-05-11 03:20:33', '2025-05-11 10:35:35'),
(33, 3, 270.00, ', \n                                , \n                                Kuswala, \n                                11400, Colombo, Western, Sri Lanka', 'Item Processing', 0, 'Lithmi', 'Kihansa', '0706761613', NULL, NULL, '2025-05-11 03:21:12', '2025-05-11 10:35:35'),
(34, 3, 330.00, 'D. R. Wijewardene Mawatha , \n                                Suduwella, \n                                Colombo, \n                                00200, Colombo, Western, Sri Lanka', 'Item Processing', 0, 'prabath', 'gunawardena', '0772761613', NULL, NULL, '2025-05-11 07:46:38', '2025-05-11 10:35:35'),
(35, 3, 1195.00, ', \n                                , \n                                Pittugala, \n                                10113', 'processing', 0, 'Lithmi', 'Kihansa', '0706761613', NULL, NULL, '2025-05-11 15:14:12', '2025-05-11 16:14:38'),
(36, 3, 830.00, ', \n                                , \n                                Pittugala, \n                                10113', 'processing', 0, 'Lithmi', 'Kihansa', '0706761613', NULL, NULL, '2025-05-11 16:21:30', '2025-05-11 16:22:12'),
(37, 3, 0.00, '', 'cart', 0, '', '', '', NULL, NULL, '2025-05-11 16:23:04', '2025-05-11 16:23:04'),
(38, 3, 1265.00, 'D. R. Wijewardene Mawatha , \n                                Suduwella, \n                                Colombo, \n                                00200', 'Item Processing', 0, 'Lithmi', 'Kihansa', '0706761613', NULL, NULL, '2025-05-12 05:03:38', '2025-05-12 05:03:38'),
(39, 3, 520.00, 'D. R. Wijewardene Mawatha , \n                                Suduwella, \n                                Colombo, \n                                00200', 'Item Processing', 0, 'Lithmi', 'Kihansa', '0706761613', NULL, NULL, '2025-05-12 05:04:17', '2025-05-12 05:04:17'),
(40, 3, 1010.00, 'D. R. Wijewardene Mawatha , \n                                Suduwella, \n                                Colombo, \n                                00200', 'Item Processing', 0, 'Lithmi', 'Kiha', '0772761613', NULL, NULL, '2025-05-12 05:07:20', '2025-05-12 05:07:20'),
(41, 3, 640.00, ', \n                                , \n                                Kuswala, \n                                11400', 'Out for Delivery', 0, 'Lakshman', 'Balasuriya', '0772761613', NULL, NULL, '2025-05-12 05:45:37', '2025-05-16 00:07:22'),
(42, 3, 830.00, ', \n                                , \n                                Ginigathhena, \n                                20686', 'Item Processing', 0, 'Lithmi', 'Kihansa', '0706761613', NULL, NULL, '2025-05-12 07:38:35', '2025-05-12 07:38:35'),
(43, 3, 1015.00, ', \n                                , \n                                Kuswala, \n                                11400', 'Item Processing', 0, 'Iroshani', 'Nilmini', '0704761613', NULL, NULL, '2025-05-12 07:49:36', '2025-05-12 07:49:36'),
(44, 3, 450.00, ', \n                                , \n                                Ginigathhena, \n                                20686', 'Item Processing', 0, 'Lithmi', 'Kihansa', '0706761613', NULL, NULL, '2025-05-12 09:15:38', '2025-05-12 09:15:38'),
(45, 3, 830.00, 'D. R. Wijewardene Mawatha ,                                 Suduwella,                                 Colombo,                                 00200', 'Item Processing', 1, 'Lithmi', 'Kihansa', '0706761613', NULL, NULL, '2025-05-12 10:40:10', '2025-05-12 11:20:57'),
(46, 3, 330.00, ', \n                                , \n                                Ginigathhena, \n                                20686', 'Out for Delivery', 1, 'Lithmi', 'Kihansa', '0706761613', NULL, NULL, '2025-05-12 11:25:06', '2025-05-16 00:07:35'),
(47, 3, 515.00, ', \n                                , \n                                Ginigathhena, \n                                20686', 'Item Processing', 0, 'Lith', 'Kiha', '0772761613', NULL, NULL, '2025-05-12 11:48:32', '2025-05-12 11:48:32'),
(48, 3, 330.00, ', \n                                Parliament Junction, \n                                Sri Jayawardenepura Kotte, \n                                10100', 'Item Processing', 1, 'Lithmi', 'Kihansa', '0706761613', NULL, NULL, '2025-05-15 22:49:00', '2025-05-15 22:49:59'),
(49, 3, 570.00, 'Dippitigoda Road , \n                                Bulugaha Junction, \n                                Hunupitiya, \n                                11300', 'Item Processing', 1, 'Lithmi', 'Kihansa', '0706761613', NULL, NULL, '2025-05-16 02:23:46', '2025-05-20 20:22:27'),
(50, 3, 785.00, ', \n                                , \n                                Kuswala, \n                                11400', 'Item Processing', 0, 'Lithmi', 'Balasuriya', '0112292373', NULL, NULL, '2025-05-20 21:07:51', '2025-05-20 21:07:51'),
(51, 3, 919.97, ', \n                                Bollegala Junction, \n                                Bollegala, \n                                10620', 'Item Processing', 0, 'Lithmi', 'Nilanjith', '0704761613', NULL, NULL, '2025-05-20 22:09:07', '2025-05-20 22:09:07'),
(52, 3, 402.00, ', \n                                Bollegala Junction, \n                                Bollegala, \n                                10620', 'Item Processing', 0, 'Lithmi', 'Kihansa', '0704761613', NULL, NULL, '2025-05-20 22:13:49', '2025-05-20 22:13:49'),
(53, 3, 414.99, ', \n                                Bollegala Junction, \n                                Bollegala, \n                                10620', 'Item Processing', 0, 'Lithmi', 'Kihansa', '0704761613', NULL, NULL, '2025-05-20 22:24:46', '2025-05-20 22:24:46'),
(54, 3, 439.99, ', \n                                Bollegala Junction, \n                                Bollegala, \n                                10620', 'Item Processing', 0, 'Lithmi', 'Kihansa', '0772761613', NULL, NULL, '2025-05-20 22:31:03', '2025-05-20 22:31:03'),
(55, 3, 400.00, ', \n                                Bollegala Junction, \n                                Bollegala, \n                                10620', 'Item Processing', 1, 'Lithmi', 'Kihansa', '0772761613', NULL, NULL, '2025-05-20 22:37:12', '2025-05-20 22:37:36');

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `item_id`, `quantity`, `price`) VALUES
(53, 14, 56, 1, 180.00),
(54, 14, 59, 1, 120.00),
(55, 14, 60, 1, 320.00),
(56, 14, 61, 1, 360.00),
(57, 15, 56, 1, 180.00),
(58, 15, 58, 2, 250.00),
(59, 16, 56, 1, 180.00),
(60, 16, 58, 2, 250.00),
(61, 17, 56, 1, 180.00),
(62, 17, 58, 2, 250.00),
(63, 18, 56, 1, 180.00),
(64, 18, 58, 2, 250.00),
(65, 19, 56, 1, 180.00),
(66, 19, 58, 2, 250.00),
(67, 20, 56, 1, 180.00),
(68, 20, 58, 2, 250.00),
(69, 21, 56, 1, 180.00),
(70, 21, 58, 2, 250.00),
(71, 22, 56, 1, 180.00),
(72, 22, 58, 2, 250.00),
(73, 23, 56, 1, 180.00),
(74, 23, 58, 2, 250.00),
(75, 24, 56, 1, 180.00),
(76, 24, 58, 2, 250.00),
(77, 25, 56, 1, 180.00),
(78, 25, 58, 2, 250.00),
(79, 26, 56, 1, 180.00),
(80, 26, 58, 2, 250.00),
(81, 27, 56, 1, 180.00),
(82, 27, 58, 2, 250.00),
(83, 28, 56, 1, 180.00),
(84, 28, 57, 1, 365.00),
(85, 28, 59, 2, 120.00),
(86, 29, 56, 1, 180.00),
(87, 29, 58, 2, 250.00),
(88, 30, 56, 1, 180.00),
(89, 30, 58, 2, 250.00),
(90, 31, 56, 1, 180.00),
(91, 31, 58, 2, 250.00),
(92, 32, 56, 1, 180.00),
(93, 32, 58, 2, 250.00),
(94, 33, 59, 1, 120.00),
(95, 34, 56, 1, 180.00),
(96, 35, 56, 2, 180.00),
(101, 35, 57, 1, 365.00),
(102, 35, 58, 1, 250.00),
(103, 35, 58, 1, 250.00),
(104, 36, 56, 1, 180.00),
(105, 36, 58, 1, 250.00),
(106, 36, 58, 1, 250.00),
(117, 38, 57, 1, 365.00),
(118, 38, 58, 3, 250.00),
(121, 39, 58, 1, 250.00),
(122, 39, 59, 1, 120.00),
(126, 40, 58, 2, 250.00),
(127, 40, 61, 1, 360.00),
(131, 41, 58, 1, 250.00),
(132, 41, 59, 2, 120.00),
(136, 42, 56, 1, 180.00),
(137, 42, 58, 2, 250.00),
(141, 43, 57, 1, 365.00),
(142, 43, 58, 2, 250.00),
(167, 44, 56, 1, 180.00),
(168, 44, 59, 1, 120.00),
(175, 45, 56, 1, 180.00),
(176, 45, 58, 2, 250.00),
(183, 46, 56, 1, 180.00),
(185, 47, 57, 1, 365.00),
(188, 48, 73, 1, 180.00),
(194, 49, 73, 1, 180.00),
(195, 49, 74, 2, 120.00),
(205, 50, 78, 3, 125.00),
(206, 50, 83, 1, 260.00),
(210, 51, 85, 1, 289.99),
(211, 51, 86, 2, 239.99),
(213, 52, 82, 252, 1.00),
(216, 53, 82, 25, 1.00),
(217, 53, 86, 1, 239.99),
(219, 54, 85, 1, 289.99),
(221, 55, 78, 2, 125.00);

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `rating` tinyint(4) NOT NULL CHECK (`rating` between 1 and 5),
  `comment` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `reviews`
--

INSERT INTO `reviews` (`id`, `user_id`, `item_id`, `rating`, `comment`, `created_at`, `updated_at`) VALUES
(1, 3, 78, 3, 'hey there', '2025-05-19 13:53:41', '2025-05-19 14:00:50'),
(2, 3, 86, 4, 'yhyhyh', '2025-05-20 18:34:07', '2025-05-20 18:34:07');

-- --------------------------------------------------------

--
-- Table structure for table `suppliers`
--

CREATE TABLE `suppliers` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `contact_person` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `suppliers`
--

INSERT INTO `suppliers` (`id`, `name`, `contact_person`, `email`, `phone`, `address`, `notes`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Test Supplier', 'John Doe', 'test@example.com', '+94 712345678', '123 Test Street, Colombo', 'This is a test supplier', 0, '2025-05-17 21:34:30', '2025-05-17 21:39:12'),
(3, 'Meadowlea Agent', 'Lithmi', NULL, '0706761613', NULL, NULL, 1, '2025-05-17 21:38:55', '2025-05-17 21:38:55'),
(6, 'no name', 'Lithmi', NULL, '0761234567', NULL, NULL, 1, '2025-05-17 21:57:08', '2025-05-17 21:57:08'),
(7, 'Astra Agent', 'Shehan', 'she@mail.com', '0773345678', NULL, NULL, 1, '2025-05-20 16:43:32', '2025-05-20 17:50:52'),
(8, 'Lithmi Kihansa ', 'Shehan', NULL, '0999999999', NULL, NULL, 1, '2025-05-20 18:16:45', '2025-05-20 18:19:24'),
(9, 'dum dum', 'Limii', 'litee@gmail.com', '0878787878', NULL, NULL, 1, '2025-05-20 18:18:58', '2025-05-20 18:18:58');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`) VALUES
(3, 'Lithmi', 'liteenilanjith@gmail.com', '$2b$10$0Fihnrw9bKG0KlhhB82TDu2LMdGdMvENOLw6fhb7ZF32ukzHfXyuq'),
(6, 'Kihansa', 'liteeknilanjith@gmail.com', '$2b$10$6CArbqOQwdvxNuUsWA5B1OFM.ufbSnlcvDoF4FIzBGIDVoBqCLro.');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin_users`
--
ALTER TABLE `admin_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `grn_details`
--
ALTER TABLE `grn_details`
  ADD PRIMARY KEY (`id`),
  ADD KEY `grn_id` (`grn_id`),
  ADD KEY `item_id` (`item_id`);

--
-- Indexes for table `grn_headers`
--
ALTER TABLE `grn_headers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `grn_number` (`grn_number`),
  ADD KEY `supplier_id` (`supplier_id`),
  ADD KEY `received_by` (`received_by`);

--
-- Indexes for table `items`
--
ALTER TABLE `items`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `item_id` (`item_id`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`,`item_id`),
  ADD KEY `item_id` (`item_id`);

--
-- Indexes for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin_users`
--
ALTER TABLE `admin_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `grn_details`
--
ALTER TABLE `grn_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `grn_headers`
--
ALTER TABLE `grn_headers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `items`
--
ALTER TABLE `items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=87;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=56;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=222;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `grn_details`
--
ALTER TABLE `grn_details`
  ADD CONSTRAINT `grn_details_ibfk_1` FOREIGN KEY (`grn_id`) REFERENCES `grn_headers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `grn_details_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`);

--
-- Constraints for table `grn_headers`
--
ALTER TABLE `grn_headers`
  ADD CONSTRAINT `grn_headers_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`),
  ADD CONSTRAINT `grn_headers_ibfk_2` FOREIGN KEY (`received_by`) REFERENCES `admin_users` (`id`);

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`);

--
-- Constraints for table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
