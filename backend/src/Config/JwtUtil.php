<?php



namespace App\Config;

define('One_HOUR', 3600);
define('One_DAY', 86400);
define('One_WEEK', 7 * 86400);
define('One_MONTH', 30 * 86400);
define('One_YEAR', 365 * 86400);


use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Dotenv\Dotenv;
use App\Models\User;
use App\Repository\UserRepository;

class JwtUtil {

    public static function generateToken(User $User)  {
        $dotenv = Dotenv::createImmutable(realpath(__DIR__ . '/../../'));
        $dotenv->load();

        $secretKey = $_ENV['SECRETKEY'];
        $algorithm = $_ENV['ALGO'];

        $UserRepository = new UserRepository();
        $UserRole = $UserRepository->findRoleById($User->id);
        $payload = [
            'iat' => time(),
            'exp' => time() + One_HOUR,
            'id' => $User->id ,
            'role' => $UserRole
        ];
        return JWT::encode($payload, $secretKey, $algorithm);
    }

    public static function ValidToken($token)  {
        $dotenv = Dotenv::createImmutable(realpath(__DIR__ . '/../../'));
        $dotenv->load();

        try {
            $secretKey = $_ENV['SECRETKEY'];
            $algorithm = $_ENV['ALGO'];

            // Decode the JWT
            $decoded = JWT::decode($token, new Key($secretKey, $algorithm));

            $decodedArray = (array)$decoded;

            $userId = $decodedArray['id'];
             return $userId;
        } catch (\Firebase\JWT\ExpiredException $e) {
            return -3; // Token is invalid due to expiration
        } catch (\Firebase\JWT\SignatureInvalidException $e) {
            return -2; // Token is invalid due to signature mismatch
        } catch (\Exception $e) {
            echo '' . $e->getMessage();
            return -1; // Token is invalid due to general error
        }
    }

    public static function getRole($token)  {
        $dotenv = Dotenv::createImmutable(realpath(__DIR__ . '/../../'));
        $dotenv->load();

        try {
            $secretKey = $_ENV['SECRETKEY'];
            // Decode the JWT
            $decoded = JWT::decode($token, new Key($secretKey, 'HS256'));

            // Convert the decoded object to an associative array
            $decodedArray = (array)$decoded;

            // Accessing the 'user_id' claim
            $userrole = $decodedArray['role'];
            return $userrole;
        } catch (\Firebase\JWT\ExpiredException $e) {
            return ""; // Token is invalid due to expiration
        } catch (\Firebase\JWT\SignatureInvalidException $e) {
            return ""; // Token is invalid due to signature mismatch
        } catch (\Exception $e) {
            return ""; // Token is invalid due to general error
        }
    }


}

?>